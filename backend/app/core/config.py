from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cirser"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "dev_secret_key_only" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1000
    
    # Mode: 'docker' or 'lite'
    DEPLOYMENT_MODE: str = "lite" 

    # Database (SQLite for Lite, Postgres for Docker)
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # Redis (Optional in Lite)
    REDIS_URL: Optional[str] = None
    
    # ChromaDB (Vector DB)
    CHROMA_HOST: Optional[str] = None # None means specific local dir
    CHROMA_PORT: Optional[int] = None
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    
    # AI Service (Colab URL)
    AI_SERVICE_URL: str = "http://localhost:8000" # Placeholder

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
