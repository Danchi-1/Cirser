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
    response = await engine.process_user_intent(req.message)
    return response
