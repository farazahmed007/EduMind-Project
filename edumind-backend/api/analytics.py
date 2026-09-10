from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.analytics import AnalyticsEvent
from models.material import Material
from models.user import User


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


# ==================================================
# REQUEST MODELS
# ==================================================

class QuizAttemptRequest(BaseModel):
    material_id: int

    score: int = Field(
        ge=0,
    )

    total: int = Field(
        ge=1,
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


class FlashcardSessionRequest(BaseModel):
    material_id: int

    cards_reviewed: int = Field(
        ge=1,
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


# ==================================================
# RECORD QUIZ ATTEMPT
# ==================================================

@router.post("/quiz-attempt")
def record_quiz_attempt(
    request: QuizAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = (
        db.query(Material)
        .filter(
            Material.id == request.material_id,
            Material.user_id == current_user.id,
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if request.score > request.total:
        raise HTTPException(
            status_code=400,
            detail="Score cannot be greater than total questions.",
        )

    event = AnalyticsEvent(
        event_type="quiz_completed",
        material_id=request.material_id,
        score=float(request.score),
        total=request.total,
        item_count=request.total,
        difficulty=request.difficulty,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Quiz attempt recorded successfully.",
        "event_id": event.id,
    }


# ==================================================
# RECORD FLASHCARD SESSION
# ==================================================

@router.post("/flashcard-session")
def record_flashcard_session(
    request: FlashcardSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = (
        db.query(Material)
        .filter(
            Material.id == request.material_id,
            Material.user_id == current_user.id,
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    event = AnalyticsEvent(
        event_type="flashcards_reviewed",
        material_id=request.material_id,
        item_count=request.cards_reviewed,
        difficulty=request.difficulty,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Flashcard session recorded successfully.",
        "event_id": event.id,
    }


# ==================================================
# GET LEARNING ANALYTICS
# ==================================================

@router.get("/")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------
    # Total materials
    # --------------------------------------------------

    total_materials = (
        db.query(func.count(Material.id))
        .filter(
            Material.user_id == current_user.id
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------
    # Quiz statistics
    # --------------------------------------------------

    quiz_events = (
        db.query(AnalyticsEvent)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            AnalyticsEvent.event_type == "quiz_completed",
            Material.user_id == current_user.id,
        )
        .order_by(
            AnalyticsEvent.created_at.asc()
        )
        .all()
    )

    valid_quiz_events = [
        event
        for event in quiz_events
        if event.total and event.total > 0
        and event.score is not None
    ]

    quizzes_completed = len(quiz_events)

    if valid_quiz_events:
        average_quiz_score = (
            sum(
                (
                    event.score / event.total
                ) * 100
                for event in valid_quiz_events
            )
            / len(valid_quiz_events)
        )
    else:
        average_quiz_score = 0

    # --------------------------------------------------
    # Flashcard statistics
    # --------------------------------------------------

    flashcard_events = (
        db.query(AnalyticsEvent)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            AnalyticsEvent.event_type == "flashcards_reviewed",
            Material.user_id == current_user.id,
        )
        .order_by(
            AnalyticsEvent.created_at.asc()
        )
        .all()
    )

    flashcards_reviewed = sum(
        event.item_count or 0
        for event in flashcard_events
    )

    # --------------------------------------------------
    # Score trend
    # --------------------------------------------------

    score_trend = []

    for event in quiz_events:
        if (
            event.total is None
            or event.total <= 0
            or event.score is None
        ):
            continue

        percentage = (
            event.score / event.total
        ) * 100

        material_title = "Unknown Material"

        if event.material_id:
            material = (
                db.query(Material)
                .filter(
                    Material.id == event.material_id,
                    Material.user_id == current_user.id,
                )
                .first()
            )

            if material:
                material_title = material.title

        score_trend.append(
            {
                "date": (
                    event.created_at.isoformat()
                    if event.created_at
                    else None
                ),
                "score": round(
                    percentage,
                    1,
                ),
                "material_id": event.material_id,
                "material_title": material_title,
            }
        )

    # --------------------------------------------------
    # Material performance
    # --------------------------------------------------

    material_performance = {}

    for event in quiz_events:
        if (
            event.material_id is None
            or event.total is None
            or event.total <= 0
            or event.score is None
        ):
            continue

        percentage = (
            event.score / event.total
        ) * 100

        if event.material_id not in material_performance:
            material_performance[event.material_id] = {
                "material_id": event.material_id,
                "material_title": "Unknown Material",
                "attempts": 0,
                "scores": [],
            }

        material_performance[
            event.material_id
        ]["attempts"] += 1

        material_performance[
            event.material_id
        ]["scores"].append(
            percentage
        )

    material_results = []

    for material_id, data in material_performance.items():
        material = (
            db.query(Material)
            .filter(
                Material.id == material_id,
                Material.user_id == current_user.id,
            )
            .first()
        )

        if material:
            data["material_title"] = material.title

        scores = data.pop("scores")

        average_score = (
            sum(scores) / len(scores)
            if scores
            else 0
        )

        material_results.append(
            {
                "material_id": data["material_id"],
                "material_title": data["material_title"],
                "attempts": data["attempts"],
                "average_score": round(
                    average_score,
                    1,
                ),
            }
        )

    material_results.sort(
        key=lambda item: item["average_score"],
        reverse=True,
    )

    # --------------------------------------------------
    # Recent activity
    # --------------------------------------------------

    recent_events = (
        db.query(AnalyticsEvent)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            Material.user_id == current_user.id,
        )
        .order_by(
            AnalyticsEvent.created_at.desc()
        )
        .limit(10)
        .all()
    )

    recent_activity = []

    for event in recent_events:
        material_title = "Unknown Material"

        if event.material_id:
            material = (
                db.query(Material)
                .filter(
                    Material.id == event.material_id,
                    Material.user_id == current_user.id,
                )
                .first()
            )

            if material:
                material_title = material.title

        if event.event_type == "quiz_completed":
            percentage = (
                (
                    event.score / event.total
                ) * 100
                if event.score is not None
                and event.total
                and event.total > 0
                else 0
            )

            recent_activity.append(
                {
                    "type": "quiz",
                    "title": "Quiz Completed",
                    "description": (
                        f"{material_title} • "
                        f"{round(percentage, 1)}%"
                    ),
                    "score": round(
                        percentage,
                        1,
                    ),
                    "material_id": event.material_id,
                    "material_title": material_title,
                    "date": (
                        event.created_at.isoformat()
                        if event.created_at
                        else None
                    ),
                }
            )

        elif event.event_type == "flashcards_reviewed":
            recent_activity.append(
                {
                    "type": "flashcards",
                    "title": "Flashcards Reviewed",
                    "description": (
                        f"{material_title} • "
                        f"{event.item_count or 0} cards"
                    ),
                    "cards_reviewed": (
                        event.item_count or 0
                    ),
                    "material_id": event.material_id,
                    "material_title": material_title,
                    "date": (
                        event.created_at.isoformat()
                        if event.created_at
                        else None
                    ),
                }
            )

    # --------------------------------------------------
    # Response
    # --------------------------------------------------

    return {
        "overview": {
            "total_materials": total_materials,
            "quizzes_completed": quizzes_completed,
            "average_quiz_score": round(
                average_quiz_score,
                1,
            ),
            "flashcards_reviewed": flashcards_reviewed,
        },
        "score_trend": score_trend,
        "material_performance": material_results,
        "recent_activity": recent_activity,
    }