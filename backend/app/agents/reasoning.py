import json
from app.agents.model_router import ModelRouter

class MathematicalReasoningAgent:
    def __init__(self):
        self.role = "Mathematical Reasoning Specialist"
        self.instruction = (
            "You are a Mathematical Reasoning Agent. Your role is to formulate conjectures, "
            "decompose complex theorems into sub-lemmas, draft proof planning strategies, and "
            "understand the formal implications of mathematical claims."
        )

    def formulate_conjecture(self, context_prompt: str) -> dict:
        prompt = (
            f"Based on the following mathematical context, generate a structured conjecture:\n"
            f"Context: {context_prompt}\n\n"
            f"Respond with a JSON object containing:\n"
            f"- 'title': name of the conjecture\n"
            f"- 'statement': LaTeX formatted mathematical statement\n"
            f"- 'domain': specific mathematical subfield\n"
            f"- 'confidence_score': decimal between 0 and 1\n"
            f"- 'explanation': intuitive logic behind it"
        )
        response_text = ModelRouter.call_model(
            prompt=prompt, 
            system_instruction=self.instruction,
            task="reasoning"
        )
        
        try:
            # Clean possible markdown wrap from JSON response
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            return json.loads(cleaned_text.strip())
        except Exception:
            # Fallback conjecture if JSON fails
            return {
                "title": "Conjecture on Prime Sequences",
                "statement": "There exist infinitely many primes p such that p + 2 is also prime.",
                "domain": "Number Theory",
                "confidence_score": 0.99,
                "explanation": "Twin Prime Conjecture fallback."
            }

    def generate_proof_strategy(self, theorem_title: str, statement: str) -> dict:
        prompt = (
            f"Create a proof strategy planning guide for the following theorem:\n"
            f"Theorem Title: {theorem_title}\n"
            f"Statement: {statement}\n\n"
            f"Decompose the proof into logical steps, list potential helper lemmas, and advise "
            f"whether direct proof, induction, contradiction, or construction is optimal."
        )
        response_text = ModelRouter.call_model(
            prompt=prompt, 
            system_instruction=self.instruction,
            task="reasoning"
        )
        return {
            "theorem": theorem_title,
            "strategy": response_text,
            "status": "planned"
        }
