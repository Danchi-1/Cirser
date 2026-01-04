import httpx
from asyncio import sleep
from app.core.config import settings
from app.services.rag.retriever import RAGRetriever
from app.services.reasoning.solver import SafeSolver
from app.schemas.rule import Rule
import json

class ReasoningEngine:
    def __init__(self):
        self.retriever = RAGRetriever()
        self.solver = SafeSolver()
        self.ai_url = f"{settings.AI_SERVICE_URL.rstrip('/')}/v1/chat/completions"

    async def process_user_intent(self, user_query: str, token: str) -> dict:
        """
        1. Access RAG for context.
        2. Format Prompt for AI.
        3. Call AI Service.
        4. Execute Tool Calls if any.
        """
        # 1. RAG Retrieval
        candidates = self.retriever.search(user_query, n_results=3)
        candidate_context = "\n".join([
            f"RuleID: {c.rule.rule_id}\nName: {c.rule.rule_name}\nDef: {c.rule.formal_definition}\nCond: {c.rule.applicability_conditions}"
            for c in candidates
        ])

        # 2. System Prompt
        system_prompt = f"""
        You are Cirser, a Senior AI Systems Architect and Electrical Engineering Reasoning Specialist.
        Your goal is to produce physically correct, auditable, rule-grounded solutions.
        
        CORE PRINCIPLES (NON-NEGOTIABLE):
        1. PARAMETER DEFINITIONS ARE LAW: You MUST explicitely state definitions (e.g. Z11 = V1/I1 | I2=0). Translate this to physical boundary conditions (e.g. "Port 2 Open").
        2. RULES ARE CONTRACTS: Check "Applicability Conditions" for every rule. If a rule is partial, REJECT IT.
        3. RULE COMPETITION: Compare all candidate rules. Explain why one is chosen and others rejected.
        4. SYMBOLIC COMPLETENESS: Equations must include ALL topological elements (e.g. Z_a + Z_b for T-network).
        5. STRICT LOOP: SOLVE_SYMBOLIC -> OBSERVE -> EXPLAIN. Do not skip steps.

        Available Rules:
        {candidate_context}
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "thought": "Deep analysis of the problem...",
            "parameter_definition": "Formal definition (e.g. Z11 = V1/I1 | I2=0)",
            "physical_interpretation": "Physical meaning (e.g. Port 2 open-circuited)",
            "candidate_rules": ["List", "of", "RuleIDs"],
            "selected_rule_id": "The Chosen One",
            "rule_rejection_reasoning": "Why others failed",
            "applicability_check": {{
                "conditions_required": ["Line 1", "Line 2"],
                "conditions_met": true,
                "justification": "Why it applies"
            }},
            "action": "SOLVE_SYMBOLIC" | "EXPLAIN" | "REFUSE",
            "equation": "Z_a + Z_b", 
            "variable": "EVAL, Z_a=10, Z_b=20" 
        }}
        
        INSTRUCTIONS:
        - If you need a calculation, output "SOLVE_SYMBOLIC".
        - Put numbers in "variable" with "EVAL" prefix (e.g. "EVAL, R=100").
        - The system will calculate and return an OBSERVATION.
        - FAILURE to provide physical interpretations or applicability checks will result in system rejection.
        - EQUATION SYNTAX: Valid Python. No spaces in variables (use "Z_a", not "Z a").
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ]

        # 3. Call AI with Retry Loop
        # 3. Call AI with ReAct Loop
        MAX_TURNS = 3
        current_turn = 0
        reasoning_steps = []
        
        while current_turn < MAX_TURNS:
            current_turn += 1
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    headers = {"Authorization": f"Bearer {token}"}
                    response = await client.post(
                        self.ai_url, 
                        json={
                            "messages": messages, 
                            "tools": None 
                        },
                        headers=headers
                    )
                    response.raise_for_status()
                    result = response.json()
                    ai_content = result["choices"][0]["message"]["content"]
                    
                    # Parse JSON logic
                    try:
                        # Strip Markdown code blocks if present
                        if "```json" in ai_content:
                            ai_content = ai_content.split("```json")[1].split("```")[0].strip()
                        elif "```" in ai_content:
                             ai_content = ai_content.split("```")[1].split("```")[0].strip()
    
                        # Find first { and last }
                        start = ai_content.find("{")
                        end = ai_content.rfind("}") + 1
                        
                        if start != -1 and end != 0:
                            json_str = ai_content[start:end]
                            plan = json.loads(json_str)
                            
                            # Execute Logic
                            
                            # CODE-LEVEL AUDIT: Enforce strictly required fields for Engineering Rigor
                            required_fields = ["parameter_definition", "physical_interpretation", "applicability_check"]
                            if plan.get("action") == "SOLVE_SYMBOLIC":
                                missing = [f for f in required_fields if f not in plan]
                                if missing:
                                    raise ValueError(f"ENGINEERING AUDIT FAILED: Missing required fields: {missing}. You must explicitly state definitions and applicability checks.")
                                    
                            if plan.get("action") == "SOLVE_SYMBOLIC":
                                variable_field = plan.get("variable", "")
                                val = "Error in calculation"
                                
                                try:
                                    if variable_field.startswith("EVAL"):
                                         # Extract parameters
                                         param_str = variable_field.replace("EVAL", "").strip()
                                         if param_str.startswith(","): param_str = param_str[1:]
                                         params = self.solver.parse_variable_assignments(param_str)
                                         
                                         # Pure numeric evaluation with parameters
                                         val = self.solver.evaluate_numeric(plan["equation"], params)
                                    else:
                                         # Symbolic solving
                                         val = self.solver.solve_symbolic(plan["equation"], variable_field)
                                except Exception as calc_err:
                                     val = f"Calculation Error: {str(calc_err)}"

                                # Record this step in the trace
                                reasoning_steps.append({
                                    "step": len(reasoning_steps) + 1,
                                    "thought": plan.get("thought", "Calculating..."),
                                    "equation": plan["equation"],
                                    "result": val,
                                    "rule_id": plan.get("selected_rule_id", "Unknown")
                                })

                                # RE-ACT: Feed result back to AI with "Rich Observation"
                                messages.append({"role": "assistant", "content": ai_content})
                                
                                # Contextualize the result for the AI
                                verification_context = f"Equation '{plan['equation']}' evaluated with {variable_field}."
                                
                                messages.append({
                                    "role": "user", 
                                    "content": f"OBSERVATION: {verification_context}\n"
                                               f"Solver Result: {val}\n\n"
                                               f"CRITICAL INSTRUCTION: Compare this result against the constraints of Rule {plan.get('selected_rule_id', 'Unknown')}.\n"
                                               f"- Does the magnitude make physical sense?\n"
                                               f"- Does it satisfy the boundary conditions?\n"
                                               f"If YES: Output an 'EXPLAIN' action with the full derivation.\n"
                                               f"If NO: Output a corrected 'SOLVE_SYMBOLIC' plan."
                                })
                                continue # NEXT TURN
                                
                            else:
                                # EXPLAIN or REFUSE or Other -> Final Answer
                                return {
                                    "status": "success", 
                                    "plan": plan,
                                    "reasoning_steps": reasoning_steps,
                                    "candidates": [c.rule.model_dump() for c in candidates]
                                }

                        else:
                             # JSON Parsing Failed
                             raise ValueError("No JSON object found")
                            
                    except ValueError as ve:
                        # JSON Retry Logic
                        if current_turn >= MAX_TURNS:
                             # Fallback on last attempt: Accept raw text as explanation
                             print(f"MAX RETRIES ({MAX_TURNS}) REACHED: Falling back to raw text.")
                             fallback_plan = {
                                 "action": "EXPLAIN",
                                 "thought": ai_content,
                                 "equation": "N/A",
                                 "variable": "N/A",
                                 "selected_rule_id": "FALLBACK"
                             }
                             return {
                                "status": "success",
                                "plan": fallback_plan,
                                "candidates": [c.rule.model_dump() for c in candidates]
                             }

                        messages.append({"role": "assistant", "content": ai_content})
                        messages.append({
                            "role": "user", 
                            "content": f"SYSTEM ERROR: Your response was not valid JSON. You MUST output ONLY a valid JSON object matching the schema. Fix the format.\nError details: {str(ve)}"
                        })
                        continue 
            
            except Exception as e:
                return {"status": "error", "message": f"Turn {current_turn} Error: {str(e)}"}
        
        return {"status": "error", "message": "Max reasoning turns reached without final explanation."}



engine = ReasoningEngine()
