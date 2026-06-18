import subprocess
import tempfile
import os
import shutil
from typing import Dict, Any
from app.config import settings

class FormalProofAgent:
    def __init__(self):
        self.role = "Formal Verification Specialist"
        self.lean_executable = settings.LEAN_PATH

    def check_lean_installed(self) -> bool:
        """Verify if the lean executable exists on PATH."""
        executable = shutil.which(self.lean_executable)
        return executable is not None

    def verify_lean_proof(self, lean_code: str) -> Dict[str, Any]:
        """
        Verify a Lean4 proof script by running it through the Lean4 compiler.
        - Returns status 'verified' if compilation succeeded without errors.
        - Returns compilation messages or errors if proof failed.
        """
        if not self.check_lean_installed():
            return {
                "success": False,
                "status": "dry_run_unverified",
                "message": "Lean4 compiler (elan/lean) not installed on local path. Proof verification executed in simulated dry-run mode.",
                "errors": []
            }

        # Create a temporary file to hold the Lean script
        with tempfile.NamedTemporaryFile(suffix=".lean", delete=False, mode="w", encoding="utf-8") as temp_file:
            temp_file.write(lean_code)
            temp_file_path = temp_file.name

        try:
            # Run Lean compiler on file
            result = subprocess.run(
                [self.lean_executable, temp_file_path],
                capture_output=True,
                text=True,
                timeout=15,
                check=False
            )
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

            stdout = result.stdout
            stderr = result.stderr

            # If Lean returns 0 exit code and there are no messages, the proof compiles successfully.
            if result.returncode == 0 and not stdout.strip() and not stderr.strip():
                return {
                    "success": True,
                    "status": "verified",
                    "message": "Lean4 compilation successful. Proof verified.",
                    "errors": []
                }
            else:
                # Compile errors exist, parse output
                errors = []
                for line in (stdout + stderr).splitlines():
                    if "error:" in line.lower():
                        errors.append(line.strip())

                return {
                    "success": False,
                    "status": "failed",
                    "message": "Lean4 compiler reported proof errors or goals remaining.",
                    "errors": errors if errors else [(stdout + stderr).strip()]
                }

        except subprocess.TimeoutExpired:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "success": False,
                "status": "timeout",
                "message": "Lean4 proof verification process timed out (limit 15 seconds).",
                "errors": ["Timeout expired during compilation."]
            }
        except Exception as e:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return {
                "success": False,
                "status": "error",
                "message": f"Execution error running Lean4 compiler: {str(e)}",
                "errors": [str(e)]
            }

    def generate_lean_skeleton(self, theorem_name: str, statement_lean: str) -> str:
        """
        Generate a starter Lean4 file with sorry placeholders.
        """
        return f"""-- MathGPT Enterprise Generated Theorem Skeleton
import Mathlib

theorem {theorem_name} : {statement_lean} := by
  sorry
"""
