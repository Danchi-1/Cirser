from app.api.deps import engine
from app.db.base_class import Base
from app.models.user import User  # Make sure User is imported so it registers with Base

def init_db():
    Base.metadata.create_all(bind=engine)
