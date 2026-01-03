import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from huggingface_hub import InferenceClient

# 1. Setup Client (Serverless Free Tier)
# This assumes the user provides HF_API_KEY in environment variables.
# We default to a powerful open model available on the API.
# Qwen/Qwen2.5-72B-Instruct is often available and very powerful.
MODEL_ID = "Qwen/Qwen2.5-72B-Instruct" 
# Fallback if 72B is busy/unavailable: "meta-llama/Meta-Llama-3-8B-Instruct"

client = InferenceClient(token=os.environ.get("HF_API_KEY"))

# 2. API Setup
app = FastAPI()

class InferenceRequest(BaseModel):
    messages: list
    max_tokens: int = 512
    temperature: float = 0.1

@app.post("/v1/chat/completions")
def chat(req: InferenceRequest):
    if not os.environ.get("HF_API_KEY"):
         raise HTTPException(status_code=500, detail="HF_API_KEY not set on server.")

    try:
        response = client.chat_completion(
            model=MODEL_ID,
            messages=req.messages,
            max_tokens=req.max_tokens,
            temperature=req.temperature,
            top_p=0.9
        )
        # Verify format (InferenceClient returns an object, we need to extract dict)
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response.choices[0].message.content
                    }
                }
            ]
        }
    except Exception as e:
        # Fallback handling or detailed logging
        print(f"Inference Error: {e}")
        raise HTTPException(status_code=503, detail=f"AI Service Busy or Error: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ready", "mode": "serverless_proxy"}
