from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import initialize_database
from app.routes import router as mindmap_router

load_dotenv(override=True)

initialize_database()

app = FastAPI(
    title="Visualli AI",
    description="AI-powered mindmap generator",
    version="1.0.0",
)

app.include_router(mindmap_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Visualli AI backend is running"
    }