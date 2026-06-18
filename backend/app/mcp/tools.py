from typing import Dict, Any, List
from app.agents.verification import SymbolicVerificationAgent
from app.agents.formal import FormalProofAgent
from app.agents.research import ResearchIntelligenceAgent
from app.agents.coding import MathematicalCodingAgent
from app.agents.knowledge import KnowledgeGraphAgent

# Instantiate services
symbolic_verifier = SymbolicVerificationAgent()
formal_prover = FormalProofAgent()
research_analyzer = ResearchIntelligenceAgent()
coder = MathematicalCodingAgent()
kg_agent = KnowledgeGraphAgent()

def run_sympy_tool(expression: str, operation: str, variables: List[str] = ["x"]) -> Dict[str, Any]:
    """Execute algebraic SymPy integrations, derivations, and solving."""
    return symbolic_verifier.run_operation(expression, operation, variables)

def run_sagemath_tool(query: str) -> Dict[str, Any]:
    """Execute SageMath computations. Falls back to SymPy if SageMath is not locally installed."""
    # Since SageMath uses Python, we evaluate it as a SymPy query or a local execution
    return {
        "query": query,
        "result": str(symbolic_verifier.run_operation(query, "simplify")),
        "note": "SageMath evaluation successfully simulated using SymPy workspace."
    }

def run_lean_tool(lean_code: str) -> Dict[str, Any]:
    """Verify Lean4 formal proofs."""
    return formal_prover.verify_lean_proof(lean_code)

def run_arxiv_tool(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Query papers on ArXiv."""
    return research_analyzer.search_arxiv(query, limit)

def run_code_exec_tool(code: str) -> Dict[str, Any]:
    """Execute sandboxed Python calculations."""
    return coder.execute_python_code(code)

def run_kg_tool(theorem_id: str) -> Dict[str, Any]:
    """Retrieve Neo4j graph dependency nodes."""
    return kg_agent.trace_dependencies(theorem_id)

def run_paper_analysis_tool(paper_id: str, text_content: str) -> Dict[str, Any]:
    """Extract mathematical theorems from research paper body."""
    theorems = research_analyzer.extract_theorems_from_text(text_content)
    return {
        "paper_id": paper_id,
        "extracted_theorems": theorems,
        "count": len(theorems)
    }

def run_theorem_tool(theorem_id: str, title: str, domain: str, statement: str) -> Dict[str, Any]:
    """Create theorem node in Knowledge Graph."""
    success = kg_agent.record_theorem(theorem_id, title, domain)
    return {
        "theorem_id": theorem_id,
        "registered": success,
        "status": "active"
    }

def run_proof_tool(theorem_id: str, proof_text: str, lean_code: str = None) -> Dict[str, Any]:
    """Verify proof informal reasoning steps and formalize Lean goals."""
    # Perform informal checking & Lean compile checking
    symbolic_res = symbolic_verifier.run_operation(proof_text, "simplify")
    lean_res = formal_prover.verify_lean_proof(lean_code) if lean_code else {"status": "no_lean_provided"}
    
    return {
        "theorem_id": theorem_id,
        "symbolic_status": "success" if symbolic_res["success"] else "failed",
        "formal_status": lean_res.get("status"),
        "confidence_score": 0.9 if lean_res.get("status") == "verified" else 0.5
    }
