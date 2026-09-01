from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.materials import router as materials_router
from api.analytics import router as analytics_router

from core.database import Base, engine

from models.material import Material
from models.analytics import AnalyticsEvent


# ==================================================
# CREATE DATABASE TABLES
# ==================================================

Base.metadata.create_all(
    bind=engine
)


# ==================================================
# FASTAPI APPLICATION
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
# ROUTERS
# ==================================================

app.include_router(
    materials_router
)

app.include_router(
    analytics_router
)


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():
    return {
        "message": "EduMind API is running 🚀"
    }


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EduMind API",
    }