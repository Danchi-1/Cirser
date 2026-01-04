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
        You are Cirser, an Electrical Engineering Reasoning Engine.
        Use the provided RULES to solve the problem.
        DO NOT hallucinate equations. Use the matching RuleID.
        
        Available Rules:
        {candidate_context}
        
        if a rule applies, output a JSON plan:
        {{
            "thought": "Brief analysis...",
            "selected_rule_id": "RuleID",
            "action": "SOLVE_SYMBOLIC" | "EXPLAIN" | "REFUSE",
            "equation": "v_in - i*R", 
            "variable": "v_in" (Target variable OR "EVAL" if purely numeric evaluation)
        }}
        
        IMPORTANT: 
        - If user provides numbers, KEEP the equation SYMBOLIC (e.g., "v_in - i*R").
        - Put the numbers in the "variable" field with "EVAL" prefix.
        - Example: if R=100 and i=0.04, set equation="v_in - i*R" and variable="EVAL, R=100, i=0.04".
        - If you need a calculation, output "SOLVE_SYMBOLIC".
        - The system will calculate the result and return it to you in the next message as an OBSERVATION.
        - Once you receive the OBSERVATION, you MUST output an "EXPLAIN" action.
        - In the "EXPLAIN" action, "thought" should contain the FULL verification and step-by-step derivation.
        - EQUATION SYNTAX: Must be valid Python. Variable names CANNOT contain spaces. Use underscores (e.g., "Z_a", not "Z a").
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ]

        # 3. Call AI with Retry Loop
        # 3. Call AI with ReAct Loop
        MAX_TURNS = 3
        current_turn = 0
        
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

                                # RE-ACT: Feed result back to AI
                                messages.append({"role": "assistant", "content": ai_content})
                                messages.append({
                                    "role": "user", 
                                    "content": f"OBSERVATION: The solver returned the result: {val}.\n"
                                               f"Now, please VERIFY if this makes sense and output an 'EXPLAIN' action."
                                               f"In your explanation, SHOW THE FULL DERIVATION using the equation {plan['equation']} and the result."
                                })
                                continue # NEXT TURN
                                
                            else:
                                # EXPLAIN or REFUSE or Other -> Final Answer
                                return {
                                    "status": "success", 
                                    "plan": plan,
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
