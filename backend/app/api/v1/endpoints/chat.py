from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from starlette.requests import Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api import deps 
from app.services.reasoning.engine import engine
from app.models.chat import ChatSession, ChatMessage
import uuid

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@router.post("/message")
@limiter.limit("20/minute")
async def send_message(
    req: ChatRequest, 
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Primary entry point for the Chatbot Interface.
    Persists history to Database.
    """
    try:
        # 1. Validate Token (Redundant with Depends but keeps logic intact)
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
             raise HTTPException(status_code=401, detail="Missing or invalid token")
        token = auth_header.split(" ")[1]

        # 2. Get or Create Session
        if req.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == req.session_id, ChatSession.user_id == current_user.id).first()
            if not session:
                # If ID passed but not found, fallback to new (or error? better to new for robustness)
                session = ChatSession(id=str(uuid.uuid4()), user_id=current_user.id, title=req.message[:30] + "...")
                db.add(session)
        else:
            session = ChatSession(id=str(uuid.uuid4()), user_id=current_user.id, title=req.message[:30] + "...")
            db.add(session)
        
        db.commit() # Commit to get ID if needed, or refresh

        # 3. Save User Message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=req.message
        )
        db.add(user_msg)
        db.commit()

        # 4. Process with Engine
        response = await engine.process_user_intent(req.message, token)
        
        # 5. Save Assistant Response
        assistant_content = ""
        meta_audit = {}
        
        if response.get("status") == "success":
            assistant_content = response.get("plan", {}).get("thought", "Analysis complete.")
            meta_audit = response.get("plan", {})
            # Also attach steps if needed? meta_audit is flexible JSON. 
            # Ideally store the whole response plan + steps for full replay.
            meta_audit["reasoning_steps"] = response.get("reasoning_steps", [])
        else:
            assistant_content = response.get("message", "Error processing request.")
        
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_content,
            meta_audit=meta_audit
        )
        db.add(assistant_msg)
        
        # Update Session Timestamp
        session.updated_at = db.query(ChatMessage).filter(ChatMessage.id == assistant_msg.id).scalar() # trick to get current time? 
        # Actually sqlalchemy handles onupdate. Just touching it.
        
        db.commit()
        
        # Return response linked to session
        response["session_id"] = session.id
        return response

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL CHAT ERROR: {e}")
        return {"status": "error", "message": f"Server Logic Error: {str(e)}"}
