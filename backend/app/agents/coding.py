import subprocess
import tempfile
import os
import sys
from typing import Dict, Any
from app.agents.model_router import ModelRouter

class MathematicalCodingAgent:
    def __init__(self):
        self.role = "Mathematical Software Architect"
        self.instruction = (
            "You are a Mathematical Coding Agent. Your task is to generate correct, "
            "performant, and commented code in Python, MATLAB, Julia, or SageMath for "
            "implementing simulations, mathematical solvers, optimization models, or plotting."
        )

    def generate_code(self, language: str, description: str, context_code: str = "") -> Dict[str, Any]:
        """
        Generate math code block based on language and target description.
        """
        prompt = (
            f"Write a single clean code block in {language} to solve this task:\n"
            f"Description: {description}\n"
            f"Existing Context Code (if any):\n{context_code}\n\n"
            f"Ensure the response contains only valid code and comments without markdown markdown formatting "
            f"except a concise explanation at the bottom. Return the output clearly."
        )
        
        response_text = ModelRouter.call_model(
            prompt=prompt,
            system_instruction=self.instruction,
            task="code"
        )
        
        # Simple extraction of code if wrapped in triple backticks
        generated_code = response_text
        explanation = ""
        if "```" in response_text:
            parts = response_text.split("```")
            for part in parts:
                cleaned_part = part.strip()
                if cleaned_part.startswith(language.lower()) or cleaned_part.startswith("python") or cleaned_part.startswith("julia"):
                    # Extract code block
                    # Skip first line if it's the language identifier
                    lines = cleaned_part.splitlines()
                    if lines[0].lower() in [language.lower(), "python", "julia", "matlab", "sagemath"]:
                        generated_code = "\n".join(lines[1:])
                    else:
                        generated_code = cleaned_part
                else:
                    explanation += part

        return {
            "language": language,
            "generated_code": generated_code.strip(),
            "explanation": explanation.strip() if explanation.strip() else "Code generated successfully.",
            "success": True
        }

    def execute_python_code(self, code: str) -> Dict[str, Any]:
        """
        Execute generated Python code safely in a temporary sandbox.
        """
        # Create temp file
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        try:
            # Execute Python script with 5-second timeout
            result = subprocess.run(
                [sys.executable, temp_file_path],
                capture_output=True,
                text=True,
                timeout=5,
                check=False
            )
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

            return {
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
        except subprocess.TimeoutExpired:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": "Execution timed out (5s limit).",
                "success": False
            }
        except Exception as e:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Error running script: {str(e)}",
                "success": False
            }
        
    def generate_julia_skeleton(self) -> str:
        return """# Julia Math Simulation
using LinearAlgebra
using Optim

function solve_simulation()
    println("Julia workspace running")
end
"""
