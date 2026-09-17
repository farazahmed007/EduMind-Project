from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.planner import StudyTask
from models.user import User
from services.adaptive_planner import (
    generate_recommendations,
    get_plan_candidates,
)


router = APIRouter(
    prefix="/api/adaptive",
    tags=["Adaptive Learning"],
)


# ==================================================
# HELPERS
# ==================================================

def _get_task_duration(
    candidate: dict[str, Any],
) -> int:
    """
    Calculate study duration from the student's
    current learning state.
    """

    priority = str(
        candidate.get(
            "priority",
            "medium",
        )
    ).strip().lower()

    trend = str(
        candidate.get(
            "quiz_score_trend",
            "insufficient_data",
        )
    ).strip().lower()

    average_score = candidate.get(
        "average_quiz_score"
    )

    try:
        average_score = (
            float(average_score)
            if average_score is not None
            else None
        )
    except (
        TypeError,
        ValueError,
    ):
        average_score = None

    # --------------------------------------------------
    # Base duration from priority.
    # --------------------------------------------------

    if priority == "high":
        duration = 60

    elif priority == "medium":
        duration = 45

    else:
        duration = 30

    # --------------------------------------------------
    # Adapt according to quiz trend.
    # --------------------------------------------------

    if trend == "declining":
        duration += 15

    elif trend == "improving":
        duration -= 10

    # --------------------------------------------------
    # Very low performance gets additional time.
    # --------------------------------------------------

    if (
        average_score is not None
        and average_score < 50
    ):
        duration += 15

    # --------------------------------------------------
    # Keep duration within a sensible range.
    # --------------------------------------------------

    return max(
        20,
        min(
            duration,
            90,
        ),
    )


def _build_adaptive_task(
    candidate: dict[str, Any],
    user_id: int,
    task_date: date,
    duration: int,
) -> StudyTask:
    """
    Convert an adaptive candidate into a StudyTask.
    """

    material_id = candidate[
        "material_id"
    ]

    material_title = candidate[
        "material_title"
    ]

    priority = str(
        candidate.get(
            "priority",
            "medium",
        )
    ).strip().lower()

    trend = str(
        candidate.get(
            "quiz_score_trend",
            "insufficient_data",
        )
    ).strip().lower()

    average_score = candidate.get(
        "average_quiz_score"
    )

    quiz_attempts = candidate.get(
        "quiz_attempts",
        0,
    )

    recommended_action = str(
        candidate.get(
            "recommended_action",
            "Review the material and practice the key concepts.",
        )
    ).strip()

    # --------------------------------------------------
    # Explain why this material was selected.
    # --------------------------------------------------

    if trend == "declining":

        adaptation_reason = (
            "Quiz performance is declining, so EduMind "
            "has increased the study focus for this material."
        )

    elif trend == "improving":

        adaptation_reason = (
            "Quiz performance is improving, so EduMind "
            "has reduced the session length and shifted "
            "toward consolidation."
        )

    elif (
        average_score is not None
        and average_score < 60
    ):

        adaptation_reason = (
            "Quiz performance is below the target range, "
            "so EduMind has allocated additional practice."
        )

    elif quiz_attempts == 0:

        adaptation_reason = (
            "There is not enough quiz history yet, so "
            "this session establishes a learning baseline."
        )

    elif candidate.get(
        "incomplete_related_tasks",
        0,
    ):

        adaptation_reason = (
            "There are unfinished related tasks, so EduMind "
            "is keeping this material active."
        )

    else:

        adaptation_reason = (
            "EduMind identified this material as a useful "
            "next learning target from your current activity."
        )

    # --------------------------------------------------
    # Store material ID so future planner activity can
    # be connected back to this material.
    # --------------------------------------------------

    description = (
        f"[material_id:{material_id}] "
        f"Adaptive {priority}-priority session. "
        f"{adaptation_reason} "
        f"Recommended action: {recommended_action}"
    )

    return StudyTask(
        user_id=user_id,
        title=f"Study: {material_title}",
        description=description[:1000],
        task_date=task_date,
        task_time=None,
        duration=duration,
        completed=False,
    )


def _candidate_has_active_task(
    candidate: dict[str, Any],
    active_tasks: list[StudyTask],
) -> bool:
    """
    Prevent duplicate unfinished adaptive tasks for
    the same material.

    Completed tasks are intentionally ignored because
    they represent useful historical learning feedback.
    """

    material_id = candidate[
        "material_id"
    ]

    material_marker = (
        f"[material_id:{material_id}]"
    )

    material_title = str(
        candidate[
            "material_title"
        ]
    ).strip().lower()

    for task in active_tasks:

        if task.completed:
            continue

        description = str(
            task.description or ""
        )

        # --------------------------------------------------
        # Preferred matching method.
        # --------------------------------------------------

        if material_marker in description:
            return True

        # --------------------------------------------------
        # Fallback for older manually-created tasks.
        # --------------------------------------------------

        task_title = str(
            task.title or ""
        ).strip().lower()

        if (
            material_title
            and material_title in task_title
        ):
            return True

    return False


def _select_plan_size(
    candidates: list[dict[str, Any]],
) -> int:
    """
    Decide how many tasks to generate.

    Lower planner adherence results in a smaller plan.
    Strong adherence allows a slightly larger plan.
    """

    if not candidates:
        return 0

    completion_rates = []

    for candidate in candidates:

        rate = candidate.get(
            "task_completion_rate"
        )

        if rate is None:
            continue

        try:
            completion_rates.append(
                float(rate)
            )

        except (
            TypeError,
            ValueError,
        ):
            continue

    # --------------------------------------------------
    # No planner history.
    # --------------------------------------------------

    if not completion_rates:
        return min(
            3,
            len(candidates),
        )

    average_completion = (
        sum(completion_rates)
        / len(completion_rates)
    )

    # --------------------------------------------------
    # Low adherence → smaller plan.
    # --------------------------------------------------

    if average_completion < 50:
        return min(
            2,
            len(candidates),
        )

    # --------------------------------------------------
    # Strong adherence → slightly larger plan.
    # --------------------------------------------------

    if average_completion >= 80:
        return min(
            4,
            len(candidates),
        )

    # --------------------------------------------------
    # Normal adherence.
    # --------------------------------------------------

    return min(
        3,
        len(candidates),
    )


# ==================================================
# GET ADAPTIVE RECOMMENDATIONS
# ==================================================

@router.get("/recommendations")
def get_adaptive_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate personalized AI study recommendations
    for the authenticated student.

    Recommendations consider:

    - Quiz performance
    - Quiz attempts
    - Quiz score trend
    - Flashcard activity
    - Learning recency
    - Planner completion
    - Incomplete related tasks
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
# GET ADAPTIVE PLAN CANDIDATES
# ==================================================

@router.get("/plan-candidates")
def get_adaptive_plan_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return prioritized learning materials that can
    be used by the adaptive plan generator.

    This endpoint does NOT create planner tasks.
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
# GENERATE ADAPTIVE STUDY PLAN
# ==================================================

@router.post("/generate-plan")
def generate_adaptive_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and persist an adaptive study plan.

    The plan is calculated from the student's CURRENT
    learning state.

    It considers:

    - Quiz performance
    - Quiz score trend
    - Quiz attempts
    - Planner adherence
    - Incomplete tasks
    - Material priority

    Existing unfinished tasks for the same material
    are not duplicated.
    """

    try:

        # ==================================================
        # 1. ANALYZE CURRENT LEARNING STATE
        # ==================================================

        candidates = get_plan_candidates(
            db=db,
            current_user=current_user,
        )

        if not candidates:

            return {
                "generated_at": None,
                "count": 0,
                "tasks": [],
                "message": (
                    "Upload study materials and complete "
                    "some learning activities before generating "
                    "an adaptive study plan."
                ),
                "adaptation": {
                    "mode": "no_data",
                    "reason": (
                        "There is not enough learning data "
                        "to generate a personalized plan."
                    ),
                },
            }

        # ==================================================
        # 2. LOAD EXISTING USER TASKS
        # ==================================================

        existing_tasks = (
            db.query(StudyTask)
            .filter(
                StudyTask.user_id
                == current_user.id
            )
            .all()
        )

        # ==================================================
        # 3. REMOVE MATERIALS THAT ALREADY HAVE AN
        #    UNFINISHED RELATED TASK
        # ==================================================

        available_candidates = [
            candidate
            for candidate in candidates
            if not _candidate_has_active_task(
                candidate,
                existing_tasks,
            )
        ]

        if not available_candidates:

            return {
                "generated_at": None,
                "count": 0,
                "tasks": [],
                "message": (
                    "Your current adaptive tasks are already "
                    "planned. Complete them and update your "
                    "learning activity to let EduMind adapt "
                    "the next plan."
                ),
                "adaptation": {
                    "mode": "no_duplicate_tasks",
                    "reason": (
                        "Existing unfinished tasks already "
                        "cover the current learning targets."
                    ),
                },
            }

        # ==================================================
        # 4. ADAPT PLAN SIZE
        # ==================================================

        plan_size = _select_plan_size(
            available_candidates
        )

        selected_candidates = (
            available_candidates[
                :plan_size
            ]
        )

        # ==================================================
        # 5. CREATE TASKS FOR UPCOMING DAYS
        # ==================================================

        today = date.today()

        created_tasks = []

        for index, candidate in enumerate(
            selected_candidates
        ):

            task_date = (
                today
                + timedelta(
                    days=index + 1
                )
            )

            duration = _get_task_duration(
                candidate
            )

            task = _build_adaptive_task(
                candidate=candidate,
                user_id=current_user.id,
                task_date=task_date,
                duration=duration,
            )

            db.add(task)

            # Flush gives us the database-generated ID
            # without committing each task individually.
            db.flush()

            created_tasks.append(
                {
                    "id": task.id,
                    "material_id": candidate[
                        "material_id"
                    ],
                    "material_title": candidate[
                        "material_title"
                    ],
                    "priority": candidate.get(
                        "priority",
                        "medium",
                    ),
                    "priority_score": candidate.get(
                        "priority_score"
                    ),
                    "quiz_score_trend": candidate.get(
                        "quiz_score_trend",
                        "insufficient_data",
                    ),
                    "average_quiz_score": candidate.get(
                        "average_quiz_score"
                    ),
                    "recent_quiz_average": candidate.get(
                        "recent_quiz_average"
                    ),
                    "previous_quiz_average": candidate.get(
                        "previous_quiz_average"
                    ),
                    "quiz_score_change": candidate.get(
                        "quiz_score_change"
                    ),
                    "quiz_attempts": candidate.get(
                        "quiz_attempts",
                        0,
                    ),
                    "task_completion_rate": candidate.get(
                        "task_completion_rate"
                    ),
                    "completed_related_tasks": candidate.get(
                        "completed_related_tasks",
                        0,
                    ),
                    "incomplete_related_tasks": candidate.get(
                        "incomplete_related_tasks",
                        0,
                    ),
                    "task_date": (
                        task_date.isoformat()
                    ),
                    "duration": duration,
                    "recommended_action": candidate.get(
                        "recommended_action"
                    ),
                }
            )

        # ==================================================
        # 6. SAVE ENTIRE PLAN
        # ==================================================

        db.commit()

        # ==================================================
        # 7. DETERMINE ADAPTATION MODE
        # ==================================================

        trends = {
            str(
                task.get(
                    "quiz_score_trend",
                    "insufficient_data",
                )
            ).lower()
            for task in created_tasks
        }

        if "declining" in trends:

            adaptation_mode = (
                "performance_declining"
            )

            adaptation_reason = (
                "The latest learning data shows declining "
                "quiz performance for at least one selected "
                "material, so EduMind increased its study focus."
            )

        elif "improving" in trends:

            adaptation_mode = (
                "performance_improving"
            )

            adaptation_reason = (
                "The latest learning data shows improving "
                "quiz performance, so EduMind reduced the "
                "session intensity for those materials."
            )

        else:

            low_adherence = False

            for task in created_tasks:

                rate = task.get(
                    "task_completion_rate"
                )

                if rate is None:
                    continue

                try:

                    if float(rate) < 50:
                        low_adherence = True
                        break

                except (
                    TypeError,
                    ValueError,
                ):
                    continue

            if low_adherence:

                adaptation_mode = (
                    "low_planner_adherence"
                )

                adaptation_reason = (
                    "Planner completion is currently low, "
                    "so EduMind kept the new plan smaller "
                    "to make it easier to complete."
                )

            else:

                adaptation_mode = (
                    "priority_based"
                )

                adaptation_reason = (
                    "The plan was generated from the latest "
                    "quiz performance, learning activity, "
                    "planner behaviour and material priorities."
                )

        # ==================================================
        # 8. RETURN PLAN RESULT
        # ==================================================

        return {
            "generated_at": today.isoformat(),
            "count": len(created_tasks),
            "tasks": created_tasks,
            "message": (
                f"Adaptive study plan generated with "
                f"{len(created_tasks)} new task"
                f"{'' if len(created_tasks) == 1 else 's'}."
            ),
            "adaptation": {
                "mode": adaptation_mode,
                "reason": adaptation_reason,
            },
        }

    except ValueError as error:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        db.rollback()

        print(
            "Adaptive study plan generation error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to generate the adaptive "
                "study plan."
            ),
        )