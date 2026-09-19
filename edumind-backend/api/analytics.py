from datetime import datetime, timedelta, timezone
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
# STUDY STREAK
# ==================================================

def calculate_study_streak(
    db: Session,
    current_user: User,
):
    """
    Calculate study streak information from recorded
    quiz and flashcard activity.

    A study day is a calendar day on which the user
    completed a quiz or recorded a flashcard session.
    """

    events = (
        db.query(AnalyticsEvent.created_at)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            Material.user_id == current_user.id,
            AnalyticsEvent.event_type.in_(
                [
                    "quiz_completed",
                    "flashcards_reviewed",
                ]
            ),
            AnalyticsEvent.created_at.isnot(None),
        )
        .order_by(
            AnalyticsEvent.created_at.asc()
        )
        .all()
    )

    active_dates = set()

    for event in events:
        created_at = event.created_at

        if created_at is None:
            continue

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        local_date = created_at.astimezone().date()

        active_dates.add(local_date)

    if not active_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "active_days_this_week": 0,
            "week_progress": 0,
        }

    sorted_dates = sorted(active_dates)

    # --------------------------------------------------
    # Longest streak
    # --------------------------------------------------

    longest_streak = 1
    running_streak = 1

    for index in range(1, len(sorted_dates)):
        previous_date = sorted_dates[index - 1]
        current_date = sorted_dates[index]

        if current_date == previous_date + timedelta(days=1):
            running_streak += 1
        else:
            running_streak = 1

        longest_streak = max(
            longest_streak,
            running_streak,
        )

    # --------------------------------------------------
    # Current streak
    # --------------------------------------------------

    today = datetime.now().astimezone().date()
    yesterday = today - timedelta(days=1)

    if today in active_dates:
        streak_date = today
    elif yesterday in active_dates:
        streak_date = yesterday
    else:
        streak_date = None

    current_streak = 0

    if streak_date is not None:
        current_streak = 1

        while (
            streak_date - timedelta(days=1)
            in active_dates
        ):
            streak_date -= timedelta(days=1)
            current_streak += 1

    # --------------------------------------------------
    # Current week activity
    # --------------------------------------------------

    start_of_week = today - timedelta(
        days=today.weekday()
    )

    active_days_this_week = sum(
        1
        for active_date in active_dates
        if start_of_week
        <= active_date
        <= today
    )

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "active_days_this_week": active_days_this_week,
        "week_progress": round(
            (active_days_this_week / 7) * 100
        ),
    }


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
        if event.total
        and event.total > 0
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
    # Study streak
    # --------------------------------------------------

    study_streak = calculate_study_streak(
        db,
        current_user,
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
        "study_streak": study_streak,
        "score_trend": score_trend,
        "material_performance": material_results,
        "recent_activity": recent_activity,
    }