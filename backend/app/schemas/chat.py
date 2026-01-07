from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str
    content: str
    meta_audit: Optional[Dict[str, Any]] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    session_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = "New Consultation"

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSession(ChatSessionBase):
    id: str
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True
