from app.api.deps import engine
from app.db.base_class import Base
from app.db.base_class import Base
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage

def init_db():
    Base.metadata.create_all(bind=engine)
