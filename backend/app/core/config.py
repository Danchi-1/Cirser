from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cirser"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "CHANGE_THIS_TO_A_STRONG_SECRET_IN_PROD" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # ChromaDB (Vector DB)
    CHROMA_HOST: str
    CHROMA_PORT: int
    
    # AI Service
    AI_SERVICE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
