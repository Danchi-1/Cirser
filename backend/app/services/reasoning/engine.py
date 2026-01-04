import httpx
import json
from app.core.config import settings
from app.services.rag.retriever import RAGRetriever
from app.services.reasoning.solver import SafeSolver
from app.schemas.reasoning import EngineeringContext, SymbolicPlan
from app.schemas.rule import Rule

class ReasoningEngine:
    def __init__(self):
        self.retriever = RAGRetriever()
        self.solver = SafeSolver()
        self.ai_url = f"{settings.AI_SERVICE_URL.rstrip('/')}/v1/chat/completions"

    async def _call_ai(self, messages: list, token: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(
                self.ai_url, 
                json={"messages": messages, "tools": None},
                headers=headers
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    def _extract_json(self, content: str) -> dict:
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end != 0:
                return json.loads(content[start:end])
            raise ValueError("No JSON found")
        except Exception as e:
            raise ValueError(f"JSON Parsing Failed: {str(e)}")

    async def process_user_intent(self, user_query: str, token: str) -> dict:
        reasoning_trace = []
        
        # --- PHASE 0: INPUT FIREWALL ---
        # Heuristic check: Is this "engineering-like"?
        # For now, we'll be permissive but could add an AI classifier here.
        # Strict gate: If it's just "hello", "hi", refuse.
        non_engineering_keywords = ["hello", "hi", "how are you", "love", "weather"]
        if len(user_query.split()) < 2 and user_query.lower() in non_engineering_keywords:
             return {"status": "success", "plan": {"action": "REFUSE", "thought": "Non-technical query refused."}, "reasoning_steps": []}

        try:
            # --- PHASE 1: CONTEXT & DEFINITION ---
            context_data = await self._phase_1_context(user_query, token)
            reasoning_trace.append({
                "step": 1, "phase": "DEFINITION",
                "thought": f"Defined {context_data['parameter_definition']} using Rule {context_data['selected_rule_id']}",
                "rule_id": context_data['selected_rule_id']
            })

            # --- PHASE 2: SYMBOLIC FORMULATION ---
            symbolic_plan = await self._phase_2_formulation(user_query, context_data, token)
            reasoning_trace.append({
                "step": 2, "phase": "FORMULATION",
                "thought": "Derived symbolic equation.",
                "equation": symbolic_plan['equation'],
                "rule_id": context_data['selected_rule_id']
            })

            # --- PHASE 3: NUMERIC EXECUTION (The Solver) ---
            result_val = await self._phase_3_execution(symbolic_plan)
            reasoning_trace.append({
                "step": 3, "phase": "EXECUTION",
                "thought": "Evaluated equation safely.",
                "equation": symbolic_plan['equation'],
                "result": result_val
            })

            # --- PHASE 4: VERIFICATION & EXPLANATION ---
            final_explanation = await self._phase_4_explanation(user_query, context_data, symbolic_plan, result_val, token)
            
            # Construct Final Legacy-Compatible Plan
            final_plan = {
                "action": "SOLVE_SYMBOLIC", # Frontend expects this to show math
                "thought": final_explanation,
                "equation": symbolic_plan['equation'],
                "parameter_definition": context_data['parameter_definition'],
                "physical_interpretation": context_data['physical_interpretation'],
                "applicability_check": context_data['applicability_check']
            }

            return {
                "status": "success",
                "plan": final_plan,
                "result": result_val,
                "reasoning_steps": reasoning_trace,
                "candidates": [] # Context candidates could be passed here
            }

        except Exception as e:
            # Fail Gracefully with Trace
            return {
                "status": "error",
                "message": f"Pipeline Error: {str(e)}",
                "reasoning_steps": reasoning_trace
            }

    async def _phase_1_context(self, user_query: str, token: str) -> dict:
        candidates = self.retriever.search(user_query, n_results=3)
        candidate_str = "\n".join([f"RuleID: {c.rule.rule_id}\nDef: {c.rule.formal_definition}\nCond: {c.rule.applicability_conditions}" for c in candidates])
        
        prompt = f"""
        PHASE 1: ENGINEERING CONTEXT
        Goal: Define the problem physics and select the best rule. DO NOT SOLVE.
        
        User Query: {user_query}
        
        Available Rules:
        {candidate_str}
        
        OUTPUT JSON (EngineeringContext):
        {{
            "parameter_definition": "Formal def (e.g. Z11 = V1/I1 | I2=0)",
            "physical_interpretation": "Physical meaning",
            "candidate_rules": ["List IDs"],
            "selected_rule_id": "Best Rule ID",
            "rule_rejection_reasoning": "Why others failed",
            "applicability_check": {{
                "conditions_required": ["List"],
                "conditions_met": true,
                "justification": "Why it applies"
            }}
        }}
        """
        
        resp = await self._call_ai([{"role": "system", "content": prompt}], token)
        return self._extract_json(resp)

    async def _phase_2_formulation(self, user_query: str, context: dict, token: str) -> dict:
        prompt = f"""
        PHASE 2: SYMBOLIC FORMULATION
        Goal: Create the symbolic equation based on Phase 1.
        
        Phase 1 Definition: {context['parameter_definition']}
        Selected Rule: {context['selected_rule_id']}
        
        Instructions:
        - Output the Python expression for the parameter.
        - Output variable assignments in 'variables' field (comma separated).
        - If numeric, use "EVAL, var=val".
        
        OUTPUT JSON (SymbolicPlan):
        {{
            "equation": "Z_a + Z_b",
            "variables": "EVAL, Z_a=10, Z_b=20"
        }}
        """
        
        resp = await self._call_ai([{"role": "system", "content": prompt}], token)
        return self._extract_json(resp)

    async def _phase_3_execution(self, plan: dict) -> str:
        # Pure Python, no AI
        variable_field = plan.get("variables", "")
        if variable_field.startswith("EVAL"):
            param_str = variable_field.replace("EVAL", "").strip()
            if param_str.startswith(","): param_str = param_str[1:]
            params = self.solver.parse_variable_assignments(param_str)
            return self.solver.evaluate_numeric(plan["equation"], params)
        else:
            return self.solver.solve_symbolic(plan["equation"], variable_field)

    async def _phase_4_explanation(self, query: str, context: dict, plan: dict, result: str, token: str) -> str:
        prompt = f"""
        PHASE 4: VERIFICATION & EXPLANATION
        Goal: Explain the result to the engineer.
        
        User Query: {query}
        Definition: {context['parameter_definition']}
        Rule: {context['selected_rule_id']}
        Equation: {plan['equation']}
        Result: {result}
        
        Output: A concise, professional engineering explanation (Markdown).
        """
        return await self._call_ai([{"role": "system", "content": prompt}], token)

engine = ReasoningEngine()
