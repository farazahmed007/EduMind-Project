from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from services.adaptive_planner import (
    generate_recommendations,
    get_plan_candidates,
)
from services.adaptive_plan_generator import (
    generate_adaptive_plan,
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/adaptive",
    tags=["Adaptive Learning"],
)


# ==================================================
# AI STUDY RECOMMENDATIONS
# ==================================================

@router.get(
    "/recommendations",
)
def get_adaptive_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate personalized AI study recommendations
    for the authenticated student.

    Recommendations are based on:
    - Quiz performance
    - Quiz attempts
    - Flashcard activity
    - Learning recency
    - Incomplete planner tasks
    """

    try:
        return generate_recommendations(
            db=db,
            current_user=current_user,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        )

    except Exception as error:
        print(
            "Adaptive recommendation error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to generate adaptive study "
                "recommendations."
            ),
        )


# ==================================================
# AUTOMATIC PLAN CANDIDATES
# ==================================================

@router.get(
    "/plan-candidates",
)
def get_adaptive_plan_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return prioritized learning materials that can be
    used by the automatic study-plan generator.

    This endpoint does NOT create planner tasks yet.

    It provides the intelligent priority layer that the
    automatic plan-generation step will use.
    """

    try:
        candidates = get_plan_candidates(
            db=db,
            current_user=current_user,
        )

        return {
            "candidates": candidates,
            "count": len(candidates),
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:
        print(
            "Adaptive plan candidate error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to calculate adaptive "
                "study-plan candidates."
            ),
        )


# ==================================================
# AUTOMATIC STUDY-PLAN GENERATION
# ==================================================

@router.post(
    "/generate-plan",
)
def generate_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an adaptive study plan for the
    authenticated student.

    The generated plan:
    - Uses the student's adaptive learning priorities.
    - Creates StudyTask records.
    - Avoids duplicate unfinished tasks.
    - Distributes tasks across the next 7 days.
    """

    try:
        return generate_adaptive_plan(
            db=db,
            current_user=current_user,
            number_of_days=7,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:
        print(
            "Adaptive study-plan generation error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to generate the adaptive "
                "study plan."
            ),
        )