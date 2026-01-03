import sympy
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import numpy as np

class SafeSolver:
    def __init__(self):
        self.allowed_locals = {
            "sin": sympy.sin,
            "cos": sympy.cos,
            "tan": sympy.tan,
            "exp": sympy.exp,
            "sqrt": sympy.sqrt,
            "pi": sympy.pi,
            "I": sympy.I,
            "Symbol": sympy.Symbol,
        }
        self.transformations = (standard_transformations + (implicit_multiplication_application,))

    def solve_symbolic(self, equation_str: str, variable_str: str) -> str:
        """
        Solves an equation for a specific variable safely.
        Equation format: "x + y - 5" (meaning = 0)
        """
        try:
            expr = parse_expr(
                equation_str, 
                transformations=self.transformations,
                global_dict={}, # No globals
                local_dict=self.allowed_locals
            )
            
            target_var = sympy.Symbol(variable_str)
            solution = sympy.solve(expr, target_var)
            
            return str(solution)
        except Exception as e:
            return f"Error: {str(e)}"

    def evaluate_numeric(self, expression_str: str, params: dict[str, float]) -> float:
        """
        Evaluates a symbolic expression with numeric parameters.
        """
        try:
            expr = parse_expr(
                expression_str,
                transformations=self.transformations,
                global_dict={}, 
                local_dict=self.allowed_locals
            )
            
            # Substitute
            # Ensure params keys are Symbols
            subs_dict = {sympy.Symbol(k): v for k, v in params.items()}
            result = expr.evalf(subs=subs_dict)
            
            return float(result)
        except Exception as e:
            raise ValueError(f"Evaluation Error: {str(e)}")
