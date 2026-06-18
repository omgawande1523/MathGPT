import uuid
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.config import settings
from app.database import (
    init_db,
    get_db,
    User,
    Project,
    Theorem,
    Proof,
    Conjecture,
    ResearchPaper,
    WorkflowRun,
    ChatHistory,
    AgentLog
)
from app.schemas import (
    UserCreate,
    UserResponse,
    Token,
    ProjectCreate,
    ProjectResponse,
    TheoremCreate,
    TheoremResponse,
    ProofSubmit,
    ProofResponse,
    ConjectureCreate,
    ConjectureResponse,
    SolverQuery,
    SolverResponse,
    CodeGenRequest,
    CodeGenResponse,
    PaperResponse,
    PaperSearchRequest,
    FormulaSearchRequest,
    FormulaSearchResponse,
    NeuroSymbolicRequest,
    NeuroSymbolicResponse
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.vector_store import vector_store
from app.graph_store import graph_store
from app.agents.orchestrator import MathGPTOrchestrator
from app.agents.verification import SymbolicVerificationAgent
from app.agents.coding import MathematicalCodingAgent
from app.agents.research import ResearchIntelligenceAgent
from app.tasks import async_verify_lean_proof, async_mine_conjecture_patterns, async_crawl_arxiv_citation_graph
from app.mcp.server import handle_json_rpc

app = FastAPI(
    title=settings.APP_NAME,
    description="Neuro-Symbolic Mathematical Research Assistant Enterprise Platform API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize PostgreSQL Tables
    init_db()
    # Initialize Qdrant Collection Structure
    vector_store.init_collections()

@app.get("/")
def read_root():
    return {"message": "Welcome to MathGPT Enterprise Neuro-Symbolic platform"}

# --- AUTHENTICATION ENDPOINTS ---

@app.post(f"{settings.API_V1_STR}/auth/signup", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User already registered with this email.")
    hashed = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=Token)
def login(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PROJECT MANAGEMENT ---

@app.post(f"{settings.API_V1_STR}/projects", response_model=ProjectResponse)
def create_project(proj: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = Project(
        name=proj.name,
        description=proj.description,
        owner_id=current_user.id
    )
    db_project.members.append(current_user)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get(f"{settings.API_V1_STR}/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return current_user.projects

# --- THEOREM EXPLORER ---

@app.post(f"{settings.API_V1_STR}/theorems", response_model=TheoremResponse)
def create_theorem(thm: TheoremCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_thm = db.query(Theorem).filter(Theorem.id == thm.id).first()
    if db_thm:
        raise HTTPException(status_code=400, detail="Theorem with this ID slug already exists.")
    
    db_thm = Theorem(
        id=thm.id,
        title=thm.title,
        statement=thm.statement,
        formal_statement_lean=thm.formal_statement_lean,
        domain=thm.domain,
        project_id=thm.project_id
    )
    db.add(db_thm)
    db.commit()
    db.refresh(db_thm)
    
    # Store vector embedding
    vector_store.upsert_theorem(
        theorem_id=db_thm.id,
        title=db_thm.title,
        statement=db_thm.statement,
        domain=db_thm.domain,
        project_id=db_thm.project_id
    )
    
    # Register graph node in Neo4j
    graph_store.create_theorem_node(db_thm.id, db_thm.title, db_thm.domain)
    
    return db_thm

@app.get(f"{settings.API_V1_STR}/theorems", response_model=List[TheoremResponse])
def list_theorems(project_id: int, db: Session = Depends(get_db)):
    return db.query(Theorem).filter(Theorem.project_id == project_id).all()

@app.get(f"{settings.API_V1_STR}/theorems/graph")
def get_theorem_graph(theorem_id: str):
    # Query Neo4j relationships
    return graph_store.get_dependency_graph(theorem_id)

@app.post(f"{settings.API_V1_STR}/theorems/link")
def link_theorems(from_id: str, to_id: str, rel_type: str):
    graph_store.create_relationship(from_id, to_id, rel_type)
    return {"message": f"Theorem {from_id} successfully linked to {to_id} via {rel_type.upper()}"}

# --- PROOF VALIDATOR ---

@app.post(f"{settings.API_V1_STR}/proofs/submit", response_model=ProofResponse)
def submit_proof(proof_in: ProofSubmit, db: Session = Depends(get_db)):
    # Create database record
    db_proof = Proof(
        theorem_id=proof_in.theorem_id,
        proof_text=proof_in.proof_text,
        lean_code=proof_in.lean_code,
        verification_status="verifying"
    )
    db.add(db_proof)
    db.commit()
    db.refresh(db_proof)

    # Launch Celery background task or fall back inline if Celery is offline
    try:
        async_verify_lean_proof.delay(db_proof.id, proof_in.lean_code or "")
    except Exception:
        print("Celery queue offline. Running proof check inline synchronously.")
        async_verify_lean_proof(db_proof.id, proof_in.lean_code or "")
    
    return db_proof

@app.get(f"{settings.API_V1_STR}/proofs/{{proof_id}}", response_model=ProofResponse)
def get_proof(proof_id: int, db: Session = Depends(get_db)):
    db_proof = db.query(Proof).filter(Proof.id == proof_id).first()
    if not db_proof:
        raise HTTPException(status_code=404, detail="Proof not found.")
    return db_proof

# --- SYMBOLIC SOLVER ---

@app.post(f"{settings.API_V1_STR}/solver", response_model=SolverResponse)
def solve_symbolic(query: SolverQuery):
    verifier = SymbolicVerificationAgent()
    result = verifier.run_operation(query.expression, query.operation, query.variables)
    return SolverResponse(
        expression=query.expression,
        operation=query.operation,
        result=result.get("result", ""),
        latex_result=result.get("latex_result", ""),
        success=result.get("success", False),
        error=result.get("error")
    )

# --- MATH CODING ---

@app.post(f"{settings.API_V1_STR}/coder/generate", response_model=CodeGenResponse)
def generate_math_code(req: CodeGenRequest):
    coder = MathematicalCodingAgent()
    result = coder.generate_code(req.language, req.task_description, req.context_code or "")
    return CodeGenResponse(
        language=req.language,
        generated_code=result.get("generated_code", ""),
        explanation=result.get("explanation", ""),
        success=result.get("success", False)
    )

@app.post(f"{settings.API_V1_STR}/coder/execute")
def execute_python_code(payload: dict):
    code = payload.get("code", "")
    coder = MathematicalCodingAgent()
    return coder.execute_python_code(code)

# --- RESEARCH PAPERS ---

@app.post(f"{settings.API_V1_STR}/research/search", response_model=List[PaperResponse])
def search_research_papers(req: PaperSearchRequest, db: Session = Depends(get_db)):
    research_agent = ResearchIntelligenceAgent()
    papers = research_agent.search_arxiv(req.query, req.limit)
    
    saved_papers = []
    for paper_data in papers:
        # Check if already exists in postgres
        db_paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_data["id"]).first()
        if not db_paper:
            db_paper = ResearchPaper(
                id=paper_data["id"],
                title=paper_data["title"],
                authors=paper_data["authors"],
                abstract=paper_data["abstract"],
                pdf_url=paper_data["pdf_url"],
                published_year=paper_data["published_year"],
                extracted_theorems=paper_data["extracted_theorems"]
            )
            db.add(db_paper)
            db.commit()
            db.refresh(db_paper)
            
            # Save into vector database as well
            vector_store.upsert_paper(
                paper_id=db_paper.id,
                title=db_paper.title,
                abstract=db_paper.abstract
            )
            # Queue citation crawler in worker or fall back inline if offline
            try:
                async_crawl_arxiv_citation_graph.delay(db_paper.id)
            except Exception:
                async_crawl_arxiv_citation_graph(db_paper.id)
            
        saved_papers.append(db_paper)
        
    return saved_papers

# --- FORMULA SEARCH ENGINE ---

@app.post(f"{settings.API_V1_STR}/formula/search", response_model=FormulaSearchResponse)
def search_equivalent_formulas(req: FormulaSearchRequest):
    # Semantic search on theorems list
    results = vector_store.search_theorems(req.latex_formula, limit=5)
    
    matches = []
    for idx, item in enumerate(results):
        matches.append({
            "theorem_id": item.get("theorem_id", ""),
            "title": item.get("title", ""),
            "statement": item.get("statement", ""),
            "similarity": 0.95 - (idx * 0.05)
        })
        
    return FormulaSearchResponse(query=req.latex_formula, matches=matches)

# --- CONJECTURES AUTOMATED GENERATOR ---

@app.post(f"{settings.API_V1_STR}/conjectures/generate", response_model=ConjectureResponse)
def generate_conjecture(payload: dict, db: Session = Depends(get_db)):
    project_id = payload.get("project_id")
    expression = payload.get("expression", "n**2 + n + 41")
    domain = payload.get("domain", "Number Theory")
    
    # Register background task or execute inline if offline
    try:
        async_mine_conjecture_patterns.delay(project_id, {"domain": domain, "expression": expression})
    except Exception:
        async_mine_conjecture_patterns(project_id, {"domain": domain, "expression": expression})
    
    # Create temporary Conjecture candidate
    temp_conjecture = Conjecture(
        title=f"Awaiting Conjecture Mining results",
        statement=f"Numerical conjecture search started with expression: {expression}",
        domain=domain,
        confidence_score=0.1,
        status="candidate",
        project_id=project_id
    )
    db.add(temp_conjecture)
    db.commit()
    db.refresh(temp_conjecture)
    
    return temp_conjecture

@app.get(f"{settings.API_V1_STR}/conjectures", response_model=List[ConjectureResponse])
def get_conjectures(project_id: int, db: Session = Depends(get_db)):
    return db.query(Conjecture).filter(Conjecture.project_id == project_id).all()

# --- NEURO-SYMBOLIC GRAPH AGENT ENGINE ---

@app.post(f"{settings.API_V1_STR}/reasoning/pipeline", response_model=NeuroSymbolicResponse)
def run_neuro_symbolic_pipeline(req: NeuroSymbolicRequest, db: Session = Depends(get_db)):
    # Trigger graph run workflow logging
    workflow_id = str(uuid.uuid4())
    wf_run = WorkflowRun(
        id=workflow_id,
        project_id=req.project_id,
        workflow_type="neuro_symbolic_chat",
        status="running",
        trigger_payload=json.dumps({"prompt": req.prompt})
    )
    db.add(wf_run)
    db.commit()

    # Save to chat history
    chat = ChatHistory(
        project_id=req.project_id,
        role="user",
        content=req.prompt
    )
    db.add(chat)
    db.commit()

    # Call orchestrator
    result = MathGPTOrchestrator.run_pipeline(req.project_id, req.prompt)

    # Save response to chat history
    chat_resp = ChatHistory(
        project_id=req.project_id,
        role="assistant",
        content=result["answer"]
    )
    db.add(chat_resp)
    
    # Complete workflow log
    wf_run.status = "completed"
    wf_run.results = json.dumps(result)
    wf_run.completed_at = datetime.datetime.utcnow()
    db.commit()

    return NeuroSymbolicResponse(
        answer=result["answer"],
        reasoning_trace=result["reasoning_trace"],
        symbolic_verification_result=result["symbolic_verification_result"],
        proof_status=result["proof_status"],
        confidence_score=result["confidence_score"],
        references=result["references"],
        knowledge_graph_links=result["knowledge_graph_links"]
    )

# --- MCP JSON-RPC BRIDGE ENDPOINT ---

@app.post(f"{settings.API_V1_STR}/mcp")
def mcp_json_rpc_bridge(request_payload: dict):
    """Expose MCP server JSON-RPC endpoint to web components directly."""
    return handle_json_rpc(request_payload)
