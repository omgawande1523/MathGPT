import sympy as sp
from typing import Dict, Any, List

class SymbolicVerificationAgent:
    def __init__(self):
        self.role = "Symbolic Computational Specialist"

    def run_operation(self, expression: str, operation: str, variables: List[str] = ["x"]) -> Dict[str, Any]:
        """
        Execute symbolic math computations using SymPy.
        Supported operations: integrate, differentiate, solve, simplify, factor, matrix_det, matrix_inv
        """
        try:
            # Setup symbols
            sym_objects = {v: sp.Symbol(v) for v in variables}
            local_dict = {**sp.__dict__, **sym_objects}

            # Parse expression
            parsed_expr = sp.sympify(expression, locals=local_dict)
            
            result = None
            if operation == "integrate":
                # Assume integration relative to the first variable
                main_var = sym_objects[variables[0]]
                result = sp.integrate(parsed_expr, main_var)
            elif operation == "differentiate":
                main_var = sym_objects[variables[0]]
                result = sp.diff(parsed_expr, main_var)
            elif operation == "solve":
                result = sp.solve(parsed_expr, list(sym_objects.values()))
            elif operation == "simplify":
                result = sp.simplify(parsed_expr)
            elif operation == "factor":
                result = sp.factor(parsed_expr)
            elif operation in ("matrix_det", "matrix_inv"):
                # Expecting nested list expression format
                mat_expr = sp.Matrix(parsed_expr)
                if operation == "matrix_det":
                    result = mat_expr.det()
                else:
                    result = mat_expr.inv()
            else:
                return {
                    "success": False,
                    "error": f"Unsupported symbolic operation: {operation}"
                }

            return {
                "success": True,
                "expression": str(parsed_expr),
                "operation": operation,
                "result": str(result),
                "latex_result": sp.latex(result),
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "expression": expression,
                "operation": operation,
                "result": "",
                "latex_result": "",
                "error": str(e)
            }

    def verify_algebraic_identity(self, left_expr: str, right_expr: str, variables: List[str] = ["x"]) -> Dict[str, Any]:
        """
        Verify if Left Hand Side (LHS) is algebraically equivalent to Right Hand Side (RHS).
        """
        try:
            sym_objects = {v: sp.Symbol(v) for v in variables}
            local_dict = {**sp.__dict__, **sym_objects}

            lhs = sp.sympify(left_expr, locals=local_dict)
            rhs = sp.sympify(right_expr, locals=local_dict)

            # Symbolic equivalence check
            diff = sp.simplify(lhs - rhs)
            is_equivalent = (diff == 0)

            return {
                "success": True,
                "is_equivalent": bool(is_equivalent),
                "difference": str(diff),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "is_equivalent": False,
                "difference": "",
                "error": str(e)
            }
        
    def evaluate_numerical_sequence(self, formula_str: str, max_n: int = 10, var: str = "n") -> List[float]:
        """
        Evaluate expression sequence for integer values to inspect patterns.
        """
        try:
            n = sp.Symbol(var)
            expr = sp.sympify(formula_str, locals={var: n})
            sequence = [float(expr.subs(n, i).evalf()) for i in range(1, max_n + 1)]
            return sequence
        except Exception:
            return []
