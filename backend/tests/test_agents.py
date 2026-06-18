from app.agents.reasoning import MathematicalReasoningAgent
from app.agents.verification import SymbolicVerificationAgent
from app.agents.formal import FormalProofAgent
from app.agents.orchestrator import MathGPTOrchestrator

def test_reasoning_agent():
    agent = MathematicalReasoningAgent()
    strategy = agent.generate_proof_strategy("Goldbach Conjecture", "Every even integer greater than 2 is the sum of two primes.")
    assert strategy["theorem"] == "Goldbach Conjecture"
    assert len(strategy["strategy"]) > 0

def test_symbolic_agent():
    agent = SymbolicVerificationAgent()
    # Test algebraic identity verification
    res = agent.verify_algebraic_identity("(x - 1)*(x + 1)", "x**2 - 1")
    assert res["success"] is True
    assert res["is_equivalent"] is True

def test_formal_proof_agent():
    agent = FormalProofAgent()
    skeleton = agent.generate_lean_skeleton("FermatSimple", "∀ n, n >= 3")
    assert "theorem FermatSimple" in skeleton
    assert "sorry" in skeleton

def test_orchestrator_pipeline():
    result = MathGPTOrchestrator.run_pipeline(
        project_id=1,
        prompt="Prove that x**2 - y**2 = (x-y)*(x+y) using algebraic verification."
    )
    assert "answer" in result
    assert len(result["reasoning_trace"]) > 0
    assert "confidence_score" in result
    assert result["confidence_score"] >= 0.0
