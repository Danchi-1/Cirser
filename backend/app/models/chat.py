from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func
from app.db.base_class import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, default="New Consultation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    # user relationship assumed in User model or backref here if needed

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String, nullable=False) # 'user', 'assistant'
    content = Column(Text, nullable=False)
    
    # Stores the full JSON plan/audit for re-simulation
    # Using JSON type (works in Postgres, falls back to Text in SQLite if needed but better to use JSON)
    # Since we support Lite (SQLite), we might need conditional type or just Text and serialize manually.
    # For now, let's use a generic JSON type if available, or just standard JSON.
    # Actually, SQLAlchemy `JSON` type works with SQLite as of 1.3+
    meta_audit = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")
