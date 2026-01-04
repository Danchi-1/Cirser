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
            "abs": sympy.Abs,
            "log": sympy.log,
            "ln": sympy.log,
            "asin": sympy.asin,
            "acos": sympy.acos,
            "atan": sympy.atan,
            "sinh": sympy.sinh,
            "cosh": sympy.cosh,
            "tanh": sympy.tanh,
            "pi": sympy.pi,
            "E": sympy.E,
            "e": sympy.E,
            "oo": sympy.oo,
            "inf": sympy.oo,
            "I": sympy.I,
            "j": sympy.I,
            "I": sympy.I,
            "Symbol": sympy.Symbol,
            "Integer": sympy.Integer,
            "Float": sympy.Float,
            "Rational": sympy.Rational,
            "Mul": sympy.Mul,
            "Add": sympy.Add,
            "Pow": sympy.Pow,
        }
        self.transformations = (standard_transformations + (implicit_multiplication_application,))

    def solve_symbolic(self, equation_str: str, variable_str: str) -> str:
        """
        Solves an equation for a specific variable safely.
        Equation format: "x + y - 5" (meaning = 0)
        """
        try:
            # Sanitize equation: Remove spaces to handle cases like "Z a" -> "Za"
            sanitized_eq = equation_str.replace(" ", "")
            expr = parse_expr(
                sanitized_eq, 
                transformations=self.transformations,
                global_dict={}, # No globals
                local_dict=self.allowed_locals
            )
            
            target_var = sympy.Symbol(variable_str)
            
            # Robustness Check:
            # If the expression is purely numeric (no variables) and doesn't contain the target,
            # the AI likely outputted an expression to evaluate (e.g. "10 + 50") instead of an equation equal to zero.
            if not expr.free_symbols and not expr.has(target_var):
                return str(float(expr))

            solution = sympy.solve(expr, target_var)
            
            return str(solution)
        except Exception as e:
            return f"Error: {str(e)}"

    def parse_variable_assignments(self, variable_str: str) -> dict:
        """
        Parses a string like "x=5, y=10" into a dictionary {'x': 5.0, 'y': 10.0}
        """
        params = {}
        try:
            # Split by comma
            parts = [p.strip() for p in variable_str.split(",")]
            for p in parts:
                if "=" in p:
                    key, val = p.split("=")
                    params[key.strip()] = float(val.strip())
        except:
             pass # Fail silently, return what we have
        return params

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
