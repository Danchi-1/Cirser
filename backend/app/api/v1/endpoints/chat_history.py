from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatSession as ChatSessionSchema, ChatMessage as ChatMessageSchema

router = APIRouter()

@router.get("/sessions", response_model=List[ChatSessionSchema])
def list_sessions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    limit: int = 50,
    skip: int = 0
):
    """
    List chat sessions for the current user.
    """
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionSchema)
def get_session(
    session_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Get a specific chat session with full history.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return session

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Delete a chat session.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Session deleted"}
