import json
import datetime
from celery import Celery
from app.config import settings
from app.database import SessionLocal, Proof, Theorem, Conjecture, ResearchPaper, WorkflowRun, AgentLog
from app.agents.formal import FormalProofAgent
from app.agents.verification import SymbolicVerificationAgent
from app.agents.research import ResearchIntelligenceAgent
from app.graph_store import graph_store

celery_app = Celery(
    "mathgpt_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="app.tasks.async_verify_lean_proof")
def async_verify_lean_proof(proof_id: int, lean_code: str):
    """
    Verify Lean4 proof script in background worker.
    """
    db = SessionLocal()
    start_time = datetime.datetime.utcnow()
    
    try:
        proof = db.query(Proof).filter(Proof.id == proof_id).first()
        if not proof:
            return f"Proof with ID {proof_id} not found."

        # Fetch matching workflow run or create one
        workflow = db.query(WorkflowRun).filter(
            WorkflowRun.project_id == proof.theorem.project_id,
            WorkflowRun.status == "running"
        ).first()
        workflow_id = workflow.id if workflow else "manual_trigger"

        # Initialize formal proof checker
        checker = FormalProofAgent()
        result = checker.verify_lean_proof(lean_code)

        # Update database fields
        proof.lean_code = lean_code
        proof.verification_status = "verified_formal" if result["success"] else "failed"
        proof.verification_log = f"Status: {result['status']}\nMessage: {result['message']}\nErrors:\n" + "\n".join(result["errors"])
        proof.confidence_score = 1.0 if result["success"] else 0.1
        
        # If verification succeeds, update parent Theorem status as well
        if result["success"]:
            proof.theorem.status = "formal_verified"
            # Update Neo4j Graph
            graph_store.create_theorem_node(proof.theorem.id, proof.theorem.title, proof.theorem.domain)

        db.commit()

        # Log step execution time
        end_time = datetime.datetime.utcnow()
        latency = int((end_time - start_time).total_seconds() * 1000)
        
        if workflow_id != "manual_trigger":
            log = AgentLog(
                workflow_id=workflow_id,
                agent_name="FormalProofAgent",
                step_description=f"Executed Lean4 compiler subprocess verification for Theorem: {proof.theorem_id}",
                input_payload=json.dumps({"lean_code_len": len(lean_code)}),
                output_payload=json.dumps(result),
                latency_ms=latency
            )
            db.add(log)
            db.commit()

        return f"Proof {proof_id} processed. Status: {proof.verification_status}"

    except Exception as e:
        db.rollback()
        return f"Worker error verifying proof {proof_id}: {str(e)}"
    finally:
        db.close()

@celery_app.task(name="app.tasks.async_crawl_arxiv_citation_graph")
def async_crawl_arxiv_citation_graph(paper_id: str):
    """
    Crawl citations list and add them to PostgreSQL.
    """
    db = SessionLocal()
    try:
        paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
        if not paper:
            return f"Paper {paper_id} not found."

        research_agent = ResearchIntelligenceAgent()
        # Search relative to this paper title to find overlapping citations
        related_papers = research_agent.search_arxiv(paper.title, limit=3)

        for p_data in related_papers:
            # Check if exists
            exists = db.query(ResearchPaper).filter(ResearchPaper.id == p_data["id"]).first()
            if not exists:
                new_paper = ResearchPaper(
                    id=p_data["id"],
                    title=p_data["title"],
                    authors=p_data["authors"],
                    abstract=p_data["abstract"],
                    pdf_url=p_data["pdf_url"],
                    published_year=p_data["published_year"],
                    extracted_theorems=p_data["extracted_theorems"]
                )
                db.add(new_paper)
                db.commit()
                # Create association
                paper.citations.append(new_paper)
            else:
                if exists not in paper.citations:
                    paper.citations.append(exists)
                    
        db.commit()
        return f"Citations index rebuilt for paper {paper_id}"
    except Exception as e:
        db.rollback()
        return f"Worker error indexing citations: {str(e)}"
    finally:
        db.close()

@celery_app.task(name="app.tasks.async_mine_conjecture_patterns")
def async_mine_conjecture_patterns(project_id: int, settings_payload: dict):
    """
    Run computational loops searching for mathematical conjectures (pattern mining).
    """
    db = SessionLocal()
    try:
        domain = settings_payload.get("domain", "Number Theory")
        expression = settings_payload.get("expression", "n**2 + n + 41")
        
        # Instantiate symbolic verifier
        verifier = SymbolicVerificationAgent()
        
        # Test values for the first 40 integers to see if prime density is high (Euler's prime-generating polynomial)
        sequence = verifier.evaluate_numerical_sequence(expression, max_n=40, var="n")
        
        # Heuristics: count prime frequency
        # Note: in Python we can do basic primality checks
        def is_prime(k):
            if k < 2: return False
            for i in range(2, int(k**0.5) + 1):
                if k % i == 0: return False
            return True

        primes_count = sum(1 for val in sequence if is_prime(int(val)))
        prime_density = primes_count / len(sequence) if sequence else 0.0

        conjecture = Conjecture(
            title=f"Euler Polynomial Prime Density Conjecture for ({expression})",
            statement=f"The sequence generated by {expression} yields a prime density of {prime_density:.1%} over the first 40 integer steps.",
            symbolic_representation=expression,
            domain=domain,
            confidence_score=prime_density,
            support_evidence=f"Simulated sequence: {sequence[:8]}... Prime count: {primes_count}/40",
            status="candidate",
            project_id=project_id
        )
        db.add(conjecture)
        db.commit()
        return f"Conjecture mined for project {project_id} with prime density {prime_density:.2%}"
    except Exception as e:
        db.rollback()
        return f"Worker pattern mining failed: {str(e)}"
    finally:
        db.close()
