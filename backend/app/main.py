from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import auth, chat, simulation, ai_proxy
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Database Init on Startup
from app.db.init_db import init_db
@app.on_event("startup")
def startup_event():
    init_db()

# CORS Policy
origins = [
    "*", # Allow all origins for now to fix the CORS issue immediately
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (We will create these files next)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
from app.api.v1.endpoints import chat_history
app.include_router(chat_history.router, prefix=f"{settings.API_V1_STR}/history", tags=["history"])
app.include_router(simulation.router, prefix=f"{settings.API_V1_STR}/simulation", tags=["simulation"])
app.include_router(ai_proxy.router, prefix="/v1", tags=["ai-proxy"]) # Mimics the external service URL structure

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Cirser Backend"}
