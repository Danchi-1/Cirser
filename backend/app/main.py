from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import auth, chat, simulation

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Policy
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite Dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers (We will create these files next)
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(simulation.router, prefix=f"{settings.API_V1_STR}/simulation", tags=["simulation"])

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Cirser Backend"}
