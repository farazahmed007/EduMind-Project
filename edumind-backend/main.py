from pathlib import Path
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.materials import router as materials_router
from api.analytics import router as analytics_router
from api.auth import router as auth_router
from api.planner import router as planner_router
from api.adaptive import router as adaptive_router
from api.profile import router as profile_router

from core.database import Base, engine

from models.material import Material
from models.analytics import AnalyticsEvent
from models.user import User
from models.planner import StudyTask


load_dotenv()


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="EduMind API",
    description="Backend API for the EduMind Adaptive Learning Platform",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
# Local development remains supported.
# For deployment, Render can provide FRONTEND_URL through
# an environment variable containing the Vercel frontend URL.

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip()

if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Static uploads
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads",
)


# ---------------------------------------------------------
# API routers
# ---------------------------------------------------------

app.include_router(materials_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(planner_router)
app.include_router(adaptive_router)
app.include_router(profile_router)


# ---------------------------------------------------------
# Basic endpoints
# ---------------------------------------------------------

@app.get("/")
def root():
    return {"message": "EduMind API is running 🚀"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "EduMind API"}
