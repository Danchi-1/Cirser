from pydantic import BaseModel
from typing import Optional, List, Any

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    status: str
    plan: Optional[dict] = None
    result: Optional[Any] = None
    candidates: Optional[List[dict]] = None
    message: Optional[str] = None
