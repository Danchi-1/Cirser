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

    async def process_user_intent(self, user_query: str) -> dict:
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
        
        If a rule applies, output a JSON plan:
        {{
            "thought": "Analysis of why rule applies...",
            "selected_rule_id": "RuleID",
            "action": "SOLVE_SYMBOLIC" | "EXPLAIN" | "REFUSE",
            "equation": "v_in - i*R", (if solving)
            "variable": "v_in" (if solving)
        }}
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ]

        # 3. Call AI
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.ai_url, 
                    json={
                        "messages": messages, 
                        "tools": None # We are using JSON mode via prompt for now
                    }
                )
                response.raise_for_status()
                result = response.json()
                ai_content = result["choices"][0]["message"]["content"]
                
                # Parse JSON from AI (Primitive extraction)
                # In prod, use a robust parser or Guidance/Outlines
                try:
                    # Find first { and last }
                    start = ai_content.find("{")
                    end = ai_content.rfind("}") + 1
                    json_str = ai_content[start:end]
                    plan = json.loads(json_str)
                except:
                   return {"status": "error", "message": "Failed to parse AI reasoning plan.", "raw": ai_content}
                
                # 4. Execute Plan
                if plan.get("action") == "SOLVE_SYMBOLIC":
                    val = self.solver.solve_symbolic(plan["equation"], plan["variable"])
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

        except Exception as e:
            return {"status": "error", "message": str(e)}

engine = ReasoningEngine()
