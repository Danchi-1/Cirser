import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from typing import List, Dict, Any
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api import deps
from fastapi import Depends

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

# Setup Client
# Falls back to simple proxy mode if no key (will error on request)
# Default model: Qwen 2.5 72B (Powerful & Free on HF API usually)
MODEL_ID = "Qwen/Qwen2.5-72B-Instruct"

class InferenceRequest(BaseModel):
    messages: List[Dict[str, str]]
    max_tokens: int = 512
    temperature: float = 0.1

@router.post("/chat/completions")
@limiter.limit("10/minute")
async def proxy_chat_completion(
    req: InferenceRequest, 
    request: Request,
    current_user = Depends(deps.get_current_active_user)
):
    """
    Internal Proxy to Hugging Face Inference API.
    This replaces the separate AI Service container.
    """
    api_key = os.environ.get("HF_API_KEY")
    if not api_key:
         raise HTTPException(status_code=500, detail="HF_API_KEY not set on server.")

    client = InferenceClient(token=api_key)

    try:
        # Run in threadpool (sync client)
        response = client.chat_completion(
            model=MODEL_ID,
            messages=req.messages,
            max_tokens=req.max_tokens,
            temperature=req.temperature,
            top_p=0.9
        )
        
        # Return OpenAI-compatible format
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
        print(f"HF Inference Error: {e}")
        # Improve error handling for rate limits
        raise HTTPException(status_code=503, detail=f"AI Provider Error: {str(e)}")
