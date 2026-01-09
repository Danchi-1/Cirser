import httpx
import json
from app.core.config import settings
from app.services.rag.retriever import RAGRetriever
from app.services.reasoning.solver import SafeSolver
from app.schemas.reasoning import EngineeringContext, SymbolicPlan
from app.schemas.rule import Rule


SYSTEM_PROMPT = """You are Cirser, a rigorous AI Engineering Reasoning Engine.
Your goal is to be technically precise, honest about limitations, and robust.

GLOBAL CONSTRAINTS:
1. Do not hallucinate. If you cannot derive an equation from the provided context, fail gracefully.
2. Do not use fake "engineer-speak" (e.g. "Rule Check PASS") unless you have verified it.
3. When solving, stay strictly within the domain of the problem.
4. If a question is purely conceptual, do not invent numbers.
"""

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

    async def _get_json_response_with_retry(self, messages: list, token: str, max_retries: int = 1) -> dict:
        """Call AI and attempt to parse JSON. Retry nicely on failure."""
        
        # 1. Initial Call
        raw_content = await self._call_ai(messages, token)
        
        try:
            return self._extract_json(raw_content)
        except ValueError as e:
            if max_retries > 0:
                # 2. Retry Logic: Feed error back to model
                # Append the invalid response and the error message
                retry_messages = messages + [
                    {"role": "assistant", "content": raw_content},
                    {"role": "user", "content": f"SYSTEM ERROR: Invalid JSON format. Error: {str(e)}. \n\nPlease fix the JSON and output ONLY the raw JSON block."}
                ]
                print(f"DEBUG: Retrying JSON parse. Error: {e}")
                retry_content = await self._call_ai(retry_messages, token)
                return self._extract_json(retry_content)
            else:
                raise e

    def _extract_json(self, content: str) -> dict:
        # STRICT extraction. No regex duct tape.
        try:
            # 1. Isolate JSON block
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            # 2. Parse strictly
            return json.loads(content)
        except json.JSONDecodeError as e:
             # Fail hard so the retry logic catches it
             raise ValueError(f"JSON Decode Error: {str(e)}")
        except Exception as e:
             raise ValueError(f"JSON Parse Error: {str(e)}")

    async def process_user_intent(self, user_query: str, token: str) -> dict:
        reasoning_trace = []
        
        # --- PHASE 0: INTENT CLASSIFICATION ---
        intent_data = await self._phase_0_intent(user_query, token)
        intents = intent_data.get("intents", ["CONCEPTUAL"]) # Default to list
        # Fallback for old prompt structure if something slips
        if isinstance(intents, str): intents = [intents]

        main_intent = "+".join(intents) # Primary label for UI logging

        # Handle Immediate Greeting
        if "GREETING" in intents:
            return {
                "status": "success",
                "plan": {
                    "action": "GREETING",
                    "thought": intent_data.get("response", "Hello. Ready to compute.")
                },
                "reasoning_steps": []
            }
        
        reasoning_trace.append({
            "step": 0, "phase": "INTENT",
            "thought": f"Classified intents as {intents}",
            "intent": main_intent
        })

        try:
            # --- PHASE 1: CONTEXT & DEFINITION ---
            context_data = await self._phase_1_context(user_query, token)
            reasoning_trace.append({
                "step": 1, "phase": "DEFINITION",
                "thought": f"Defined context.",
                "rule_id": context_data.get('selected_rule_id', 'N/A')
            })

            symbolic_plan = {"equation": "N/A", "variables": ""}
            result_val = "N/A"

            # Skip Solver for Purely Conceptual Queries (unless they also requested derivation)
            if "CONCEPTUAL" in intents and not ("SYMBOLIC" in intents or "NUMERICAL" in intents):
                result_val = "Skipped (Conceptual)"
                symbolic_plan['equation'] = "Conceptual Explanation Only"
            
            else:
                # --- PHASE 2: SYMBOLIC FORMULATION ---
                # Run if SYMBOLIC or NUMERICAL
                symbolic_plan = await self._phase_2_formulation(user_query, context_data, token)
                
                # Check for Hard Failure (from updated Phase 2 Prompt)
                if symbolic_plan.get('equation') == "UNDEFINED":
                    result_val = "Derivation Failed"
                    reasoning_trace.append({
                        "step": 2, "phase": "FORMULATION",
                        "thought": "Could not explicitly derive equation from selected rule.",
                        "equation": "UNDEFINED"
                    })
                else:
                    reasoning_trace.append({
                        "step": 2, "phase": "FORMULATION",
                        "thought": "Derived symbolic equation.",
                        "equation": symbolic_plan['equation']
                    })

                    # --- PHASE 3: NUMERIC EXECUTION ---
                    # Only Run if NUMERICAL or if Variables provided for pure Eval
                    if "NUMERICAL" in intents or "EVAL" in symbolic_plan['variables']:
                        result_val = await self._phase_3_execution(symbolic_plan)
                        reasoning_trace.append({
                            "step": 3, "phase": "EXECUTION",
                            "thought": "Evaluated equation safely.",
                            "result": result_val
                        })
                    else:
                        result_val = "Symbolic Derivation Only"
                        reasoning_trace.append({
                            "step": 3, "phase": "EXECUTION",
                            "thought": "Skipped numeric evaluation (Symbolic Intent).",
                            "result": "N/A"
                        })

            # --- PHASE 4: VERIFICATION & EXPLANATION ---
            verification_note = ""
            # Automatic Deep Verify for any valid derivation (Intent-based & Equation-valid)
            if ("SYMBOLIC" in intents or "NUMERICAL" in intents) and symbolic_plan.get('equation') not in ["UNDEFINED", "N/A"]:
                verify_result = await self._phase_5_deep_verify(user_query, context_data, symbolic_plan, token)
                reasoning_trace.append({
                    "step": 4, "phase": "DEEP_VERIFICATION",
                    "thought": f"Cross-referenced with external knowledge base.",
                    "result": verify_result['status']
                })
                verification_note = f"\n\n**🛡️ Deep Verification ({verify_result['status']}):**\n{verify_result['analysis']}"

            # Robust Phase 4 call with Fallback
            try:
                final_explanation = await self._phase_4_explanation(user_query, context_data, symbolic_plan, result_val, str(intents), token)
            except Exception as e:
                final_explanation = f"**Result:** {result_val}\n\n*Note: Detailed engineering explanation unavailable (Service Error: {str(e)}).*"
            
            final_explanation += verification_note
            
            final_plan = {
                "action": "SOLVE_NUMERIC" if "NUMERICAL" in intents else ("SOLVE_SYMBOLIC" if "SYMBOLIC" in intents else "EXPLAIN"), 
                "thought": final_explanation,
                "equation": symbolic_plan.get('equation', 'N/A'),
                "parameter_definition": context_data.get('parameter_definition', ''),
                "physical_interpretation": context_data.get('physical_interpretation', ''),
                "applicability_check": context_data.get('applicability_check', {}),
                "variable": symbolic_plan.get('variables', '') 
            }

            return {
                "status": "success",
                "plan": final_plan,
                "result": result_val,
                "reasoning_steps": reasoning_trace,
                "candidates": [] 
            }

        except Exception as e:
            # Fail Gracefully with Trace
            # Clean up the error message for the user
            error_msg = str(e)
            if "JSON" in error_msg:
                user_msg = "Format Error: AI produced invalid engineering notation. Retrying usually fixes this."
            else:
                user_msg = f"Processing Interrupted: {error_msg}"
                
            return {
                "status": "error",
                "message": user_msg,
                "debug_error": error_msg, # For developer logs
                "reasoning_steps": reasoning_trace
            }

    async def _phase_0_intent(self, user_query: str, token: str) -> dict:
        prompt = f"""
        PHASE 0: INTENT CLASSIFICATION
        Goal: Classify the user query into one or more categories.

        User Query: {user_query}

        Categories:
        - GREETING: Social interaction.
        - CONCEPTUAL: Explanatory questions.
        - SYMBOLIC: Derivation requested.
        - NUMERICAL: Calculation requested.

        OUTPUT JSON:
        {{
            "intents": ["SYMBOLIC", "NUMERICAL"], 
            "response": "Pre-generated response if GREETING"
        }}
        """
        # Proper System/User split
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        return await self._get_json_response_with_retry(messages, token)

    async def _phase_1_context(self, user_query: str, token: str) -> dict:
        candidates = self.retriever.search(user_query, n_results=3)
        candidate_str = "\n".join([f"RuleID: {c.rule.rule_id}\nDef: {c.rule.formal_definition}\nCond: {c.rule.applicability_conditions}" for c in candidates])
        
        prompt = f"""
        PHASE 1: ENGINEERING CONTEXT
        Goal: Define the problem physics.
        
        User Query: {user_query}
        
        Available Rules:
        {candidate_str}
        
        OUTPUT JSON (EngineeringContext):
        IMPORTANT: Single backslashes in strings MUST be escaped.
        {{
            "parameter_definition": "Formal definition",
            "physical_interpretation": "Physical context",
            "candidate_rules": ["List IDs"],
            "selected_rule_id": "Best Rule ID",
            "rule_rejection_reasoning": "Why others failed",
            "applicability_check": {{
                "conditions_required": ["List"],
                "conditions_met": true/false,
                "justification": "CRITICAL: If rule conditions not met, set false."
            }}
        }}
        """
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        return await self._get_json_response_with_retry(messages, token)

    async def _phase_2_formulation(self, user_query: str, context: dict, token: str) -> dict:
        prompt = f"""
        PHASE 2: SYMBOLIC FORMULATION
        Goal: Create the symbolic equation based on Phase 1.
        
        Phase 1 Definition: {context['parameter_definition']}
        Selected Rule: {context['selected_rule_id']}
        
        Instructions:
        - Output the Python expression for the parameter.
        - Output variable assignments in 'variables' field.
        
        CRITICAL CONSTRAINTS:
        1. DO NOT use port variables (V1, I1, V2, I2) in the equation.
        2. Express the result ONLY in terms of component impedances (Z1, Z2, R1, etc.) or intermediate values defined in 'variables'.
        3. STRICT: If the equation cannot be derived explicitly from the selected rule definition, return "equation": "UNDEFINED" and explain why in a variable comment.
        4. No assumptions. Ever.
        
        OUTPUT JSON (SymbolicPlan):
        IMPORTANT: Single backslashes in strings MUST be escaped.
        {{
            "equation": "R_load * I_in", 
            "variables": "EVAL, R_load=100, I_in=0.5"
        }}
        """
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        return await self._get_json_response_with_retry(messages, token)

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

    async def _phase_4_explanation(self, query: str, context: dict, plan: dict, result: str, intent: str, token: str) -> str:
        prompt = f"""
        PHASE 4: EXPLANATION
        Goal: Explain the result to the engineer professionally.
        
        User Query: {query}
        Intent: {intent}
        Definition: {context.get('parameter_definition', 'N/A')}
        Equation: {plan.get('equation', 'N/A')}
        Result: {result}
        
        Instructions:
        - Be concise and direct.
        - If Intent is CONCEPTUAL, focus on the physics.
        - If Result is UNDEFINED or FAILED, explain the missing information clearly.
        
        Output: A concise, professional engineering explanation (Markdown).
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        return await self._call_ai(messages, token)

    async def _phase_5_deep_verify(self, query: str, context: dict, plan: dict, token: str) -> dict:
        try:
            from app.services.tools.search import search_physics_concepts
        except ImportError:
            return {"status": "SKIPPED", "analysis": "Search tool not installed (dev mode)."}

        search_query = f"{context.get('parameter_definition', '')} formula {context.get('selected_rule_id', '')}"
        search_results = search_physics_concepts(search_query, max_results=3)

        prompt = f"""
        PHASE 5: DEEP VERIFICATION
        Goal: Cross-reference derivation with external search.

        Derived Equation: {plan.get('equation', 'N/A')}
        Used Rule: {context.get('selected_rule_id', 'N/A')}
        
        External Search Results:
        {search_results}

        Task: Compare the Derived Equation with the External Search Results.
        - If they match/align, return status "VERIFIED".
        - If they contradict, return status "FLAGGED".
        - Provide a concise analysis.

        OUTPUT JSON:
        {{
            "status": "VERIFIED" | "FLAGGED",
            "analysis": "Brief comparison analysis..."
        }}
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
        return await self._get_json_response_with_retry(messages, token)

engine = ReasoningEngine()
