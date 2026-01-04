from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api import deps # Import deps

limiter = Limiter(key_func=get_remote_address)
from app.services.reasoning.engine import engine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/message")
@limiter.limit("20/minute")
async def send_message(
    req: ChatRequest, 
    request: Request,
    current_user = Depends(deps.get_current_active_user)
):
    """
    Primary entry point for the Chatbot Interface.
    """
    # Extract the raw token to forward to the AI Proxy
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         # Should be caught by Depends(current_user) but safe fallback
         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    
    response = await engine.process_user_intent(req.message, token)
    return response
