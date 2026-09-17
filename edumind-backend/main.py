from pathlib import Path

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


# ==================================================
# DATABASE
# ==================================================

Base.metadata.create_all(
    bind=engine
)


# ==================================================
# APPLICATION
# ==================================================

app = FastAPI(
    title="EduMind API",
    description="Backend API for the EduMind Adaptive Learning Platform",
    version="1.0.0",
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# STATIC FILES
# ==================================================

BASE_DIR = Path(
    __file__
).resolve().parent

UPLOADS_DIR = (
    BASE_DIR / "uploads"
)

UPLOADS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOADS_DIR
    ),
    name="uploads",
)


# ==================================================
# API ROUTES
# ==================================================

app.include_router(
    materials_router
)

app.include_router(
    analytics_router
)

app.include_router(
    auth_router
)

app.include_router(
    planner_router
)

app.include_router(
    adaptive_router
)

app.include_router(
    profile_router
)


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():
    return {
        "message": "EduMind API is running 🚀"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EduMind API",
    }