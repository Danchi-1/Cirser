from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.reasoning.engine import engine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/message")
async def send_message(req: ChatRequest):
    """
    Primary entry point for the Chatbot Interface.
    """
    response = await engine.process_user_intent(req.message)
    return response
