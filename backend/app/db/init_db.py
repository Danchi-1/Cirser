from app.api.deps import engine
from app.models.user import Base # Import Base from models

def init_db():
    Base.metadata.create_all(bind=engine)
