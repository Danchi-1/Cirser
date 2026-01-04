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
        - ALWAYS choose "SOLVE_SYMBOLIC" if the user wants a calculation.
        - EQUATION SYNTAX: Must be valid Python. Variable names CANNOT contain spaces. Use underscores (e.g., "Z_a", not "Z a").
        - EQUATION SYNTAX: Must be valid Python. Variable names CANNOT contain spaces. Use underscores (e.g., "Z_a", not "Z a").
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ]

        # 3. Call AI with Retry Loop
        MAX_RETRIES = 2
        for attempt in range(MAX_RETRIES + 1):
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
                            
                            # Success! Execute Logic
                            # Success! Execute Logic
                            if plan.get("action") == "SOLVE_SYMBOLIC":
                                variable_field = plan.get("variable", "")
                                
                                if variable_field.startswith("EVAL"):
                                     # Extract parameters: "EVAL, R=100, i=0.04" -> {'R': 100.0, 'i': 0.04}
                                     param_str = variable_field.replace("EVAL", "").strip()
                                     # Remove leading comma if present
                                     if param_str.startswith(","):
                                         param_str = param_str[1:]
                                         
                                     params = self.solver.parse_variable_assignments(param_str)
                                     
                                     # Pure numeric evaluation with parameters
                                     val = self.solver.evaluate_numeric(plan["equation"], params)
                                else:
                                     # Symbolic solving
                                     val = self.solver.solve_symbolic(plan["equation"], variable_field)
                                
                                return {
                                    "status": "success",
                                    "plan": plan,
                                    "result": val,
                                    "candidates": [c.rule.model_dump() for c in candidates]
                                }
                            else:
                                return {
                                    "status": "success", 
                                    "plan": plan,
                                    "candidates": [c.rule.model_dump() for c in candidates]
                                }

                        else:
                            raise ValueError("No JSON object found")
                            
                    except Exception as e:
                        print(f"ATTEMPT {attempt+1} FAILED: {str(e)}")
                        if attempt < MAX_RETRIES:
                            # Add correction prompt and retry
                            messages.append({"role": "assistant", "content": ai_content})
                            messages.append({
                                "role": "user", 
                                "content": f"SYSTEM ERROR: Your response was not valid JSON. You MUST output ONLY a valid JSON object matching the schema. Fix the format.\nError details: {str(e)}"
                            })
                            continue
                        else:
                           raise ValueError(f"AI failed to generate valid JSON after {MAX_RETRIES+1} attempts.")
            
            except Exception as e:
                # If network error, fail immediately (or retry if transient, but simplifying here)
                 if attempt == MAX_RETRIES:
                    return {"status": "error", "message": str(e)}



engine = ReasoningEngine()
