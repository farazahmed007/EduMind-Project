from datetime import date, timedelta

from sqlalchemy.orm import Session

from models.planner import StudyTask
from models.user import User
from services.adaptive_planner import get_plan_candidates


DEFAULT_PLAN_DAYS = 7
MAX_PLAN_TASKS = 5

MIN_TASK_DURATION = 25
MAX_TASK_DURATION = 60

ADAPTIVE_MARKER = "[material_id:"


def _clamp_duration(duration: int) -> int:
    """
    Keep generated task durations within a sensible range.
    """
    return max(
        MIN_TASK_DURATION,
        min(duration, MAX_TASK_DURATION),
    )


def _extract_material_id(description: str):
    """
    Extract material_id from an adaptive task description.

    Example:
        [material_id:16]
    """

    if not description:
        return None

    if ADAPTIVE_MARKER not in description:
        return None

    try:
        start = (
            description.index(ADAPTIVE_MARKER)
            + len(ADAPTIVE_MARKER)
        )

        end = description.index("]", start)

        return int(
            description[start:end].strip()
        )

    except (ValueError, IndexError):
        return None


def _get_existing_future_material_ids(
    db: Session,
    current_user: User,
) -> set[int]:
    """
    Find materials that already have unfinished future
    planner tasks.

    This prevents regeneration from creating duplicate
    unfinished tasks for the same material.
    """

    today = date.today()

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.completed.is_(False),
            StudyTask.task_date >= today,
        )
        .all()
    )

    material_ids = set()

    for task in tasks:
        material_id = _extract_material_id(
            task.description or ""
        )

        if material_id is not None:
            material_ids.add(material_id)

    return material_ids


def _get_completed_adaptive_history(
    db: Session,
    current_user: User,
) -> dict[int, list[StudyTask]]:
    """
    Retrieve previously completed adaptive tasks grouped
    by material.

    This gives the regeneration process historical context.

    Example:

        material 16:
            completed "Strengthen Study Material"
            completed "Practice Study Material"

    The history can then be used to avoid treating every
    regeneration as a completely new learning situation.
    """

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.completed.is_(True),
        )
        .order_by(
            StudyTask.created_at.desc()
        )
        .all()
    )

    history = {}

    for task in tasks:
        material_id = _extract_material_id(
            task.description or ""
        )

        if material_id is None:
            continue

        history.setdefault(
            material_id,
            [],
        ).append(task)

    return history


def _calculate_plan_capacity(
    candidates: list[dict],
) -> int:
    """
    Adapt the number of new tasks to the student's
    planner completion behaviour.

    Low adherence:
        smaller plan

    Good adherence:
        larger plan
    """

    if not candidates:
        return 0

    completion_rates = [
        candidate.get(
            "task_completion_rate",
            0,
        )
        for candidate in candidates
        if candidate.get(
            "total_related_tasks",
            0,
        ) > 0
    ]

    if not completion_rates:
        return 4

    average_completion = (
        sum(completion_rates)
        / len(completion_rates)
    )

    if average_completion < 50:
        return 2

    if average_completion < 70:
        return 3

    if average_completion < 85:
        return 4

    return MAX_PLAN_TASKS


def _get_adaptive_task_details(
    candidate: dict,
    previous_tasks: list[StudyTask],
) -> dict:
    """
    Convert the student's CURRENT learning signals into
    an adaptive task.

    The decision considers:

    - quiz performance
    - quiz trend
    - recent activity
    - unfinished work
    - planner adherence
    - previous adaptive tasks
    """

    title = candidate.get(
        "title",
        "Study Material",
    )

    material_id = candidate.get(
        "material_id"
    )

    average_score = candidate.get(
        "average_quiz_score"
    )

    recent_score = candidate.get(
        "recent_quiz_average"
    )

    trend = candidate.get(
        "quiz_score_trend",
        "insufficient_data",
    )

    incomplete_tasks = candidate.get(
        "incomplete_related_tasks",
        0,
    )

    completion_rate = candidate.get(
        "task_completion_rate",
        0,
    )

    days_since_activity = candidate.get(
        "days_since_activity"
    )

    previous_task_count = len(
        previous_tasks
    )

    material_marker = (
        f"[material_id:{material_id}]"
    )

    # ---------------------------------------------------------
    # 1. DECLINING PERFORMANCE
    # ---------------------------------------------------------

    if trend == "declining":
        return {
            "title": f"Revise {title}",
            "description": (
                f"Your recent performance in {title} "
                "has declined. Review the weak concepts, "
                "identify mistakes, and finish with "
                "practice questions or a short quiz. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(50),
            "reason": "declining_performance",
        }

    # ---------------------------------------------------------
    # 2. LOW PERFORMANCE
    # ---------------------------------------------------------

    if (
        recent_score is not None
        and recent_score < 60
    ) or (
        average_score is not None
        and average_score < 60
    ):
        return {
            "title": f"Strengthen {title}",
            "description": (
                f"Your current performance in {title} "
                "is below the target level. Relearn the "
                "important concepts, focus on mistakes, "
                "and complete practice questions. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(55),
            "reason": "low_performance",
        }

    # ---------------------------------------------------------
    # 3. IMPROVING PERFORMANCE
    # ---------------------------------------------------------

    if trend == "improving":
        return {
            "title": f"Practice {title}",
            "description": (
                f"Your performance in {title} is improving. "
                "Move from basic revision toward active "
                "practice and slightly more challenging "
                "questions. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(35),
            "reason": "improving_performance",
        }

    # ---------------------------------------------------------
    # 4. NO ASSESSMENT HISTORY
    # ---------------------------------------------------------

    if average_score is None:
        return {
            "title": f"Learn {title}",
            "description": (
                f"Study the main concepts from {title}. "
                "Focus on understanding the material and "
                "finish with a short self-check or quiz "
                "to establish your baseline. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(45),
            "reason": "insufficient_data",
        }

    # ---------------------------------------------------------
    # 5. NEGLECTED MATERIAL
    # ---------------------------------------------------------

    if (
        days_since_activity is not None
        and days_since_activity >= 7
    ):
        return {
            "title": f"Refresh {title}",
            "description": (
                f"{title} has not been studied recently. "
                "Refresh the important concepts and use "
                "active recall to bring the material back "
                "into memory. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(35),
            "reason": "inactive_material",
        }

    # ---------------------------------------------------------
    # 6. UNFINISHED WORK
    # ---------------------------------------------------------

    if incomplete_tasks > 0:
        return {
            "title": f"Continue {title}",
            "description": (
                f"You still have unfinished work related "
                f"to {title}. Complete the existing learning "
                "work before moving to another activity. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(30),
            "reason": "unfinished_work",
        }

    # ---------------------------------------------------------
    # 7. STRONG PERFORMANCE
    # ---------------------------------------------------------

    if (
        recent_score is not None
        and recent_score >= 75
        and completion_rate >= 80
    ):
        return {
            "title": f"Maintain {title}",
            "description": (
                f"Your recent performance in {title} is "
                "strong and your planner adherence is good. "
                "Use a short active-recall and practice "
                "session to maintain your understanding "
                "without spending unnecessary time on it. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(25),
            "reason": "strong_performance",
        }

    # ---------------------------------------------------------
    # 8. PREVIOUSLY COMPLETED BUT CURRENT STATE IS STABLE
    # ---------------------------------------------------------

    if previous_task_count > 0:
        return {
            "title": f"Practice {title}",
            "description": (
                f"You have already completed previous study "
                f"work for {title}. Continue with active "
                "practice to reinforce the material instead "
                "of repeating the same basic study session. "
                f"{material_marker}"
            ),
            "duration": _clamp_duration(30),
            "reason": "reinforcement",
        }

    # ---------------------------------------------------------
    # 9. DEFAULT
    # ---------------------------------------------------------

    return {
        "title": f"Study {title}",
        "description": (
            f"Study {title}, review the important concepts, "
            "and test your understanding with practice "
            "questions. "
            f"{material_marker}"
        ),
        "duration": _clamp_duration(35),
        "reason": "default",
    }


def _select_candidates_for_regeneration(
    candidates: list[dict],
    existing_material_ids: set[int],
    plan_capacity: int,
) -> list[dict]:
    """
    Select candidates for the new plan.

    Candidates are already prioritized by the adaptive
    planner. We additionally prevent materials with existing
    unfinished future tasks from being regenerated.
    """

    selected = []

    for candidate in candidates:

        if len(selected) >= plan_capacity:
            break

        material_id = candidate.get(
            "material_id"
        )

        if material_id is None:
            continue

        if material_id in existing_material_ids:
            continue

        selected.append(candidate)

    return selected


def generate_adaptive_plan(
    db: Session,
    current_user: User,
    plan_days: int = DEFAULT_PLAN_DAYS,
) -> dict:
    """
    Generate a new adaptive study plan.

    Every regeneration recalculates the student's CURRENT
    learning state.

    The new plan responds to:

    - new quiz scores
    - quiz score trends
    - completed planner tasks
    - unfinished planner tasks
    - planner adherence
    - material inactivity
    - previous adaptive study history

    Existing unfinished future tasks are preserved and are
    not duplicated.
    """

    if plan_days < 1:
        plan_days = DEFAULT_PLAN_DAYS

    if plan_days > 30:
        plan_days = 30

    # ---------------------------------------------------------
    # STEP 1: Recalculate current learning state
    # ---------------------------------------------------------

    candidates = get_plan_candidates(
        db=db,
        current_user=current_user,
    )

    if not candidates:
        return {
            "message": (
                "No learning materials are available "
                "to generate an adaptive study plan."
            ),
            "tasks_created": 0,
            "plan_days": plan_days,
            "tasks": [],
        }

    # ---------------------------------------------------------
    # STEP 2: Check existing unfinished work
    # ---------------------------------------------------------

    existing_material_ids = (
        _get_existing_future_material_ids(
            db=db,
            current_user=current_user,
        )
    )

    # ---------------------------------------------------------
    # STEP 3: Load completed adaptive history
    # ---------------------------------------------------------

    completed_history = (
        _get_completed_adaptive_history(
            db=db,
            current_user=current_user,
        )
    )

    # ---------------------------------------------------------
    # STEP 4: Adapt workload to planner adherence
    # ---------------------------------------------------------

    plan_capacity = _calculate_plan_capacity(
        candidates
    )

    selected_candidates = (
        _select_candidates_for_regeneration(
            candidates=candidates,
            existing_material_ids=existing_material_ids,
            plan_capacity=plan_capacity,
        )
    )

    # ---------------------------------------------------------
    # STEP 5: Generate tasks
    # ---------------------------------------------------------

    created_tasks = []

    start_date = date.today()

    for candidate in selected_candidates:

        material_id = candidate.get(
            "material_id"
        )

        previous_tasks = completed_history.get(
            material_id,
            [],
        )

        task_details = _get_adaptive_task_details(
            candidate=candidate,
            previous_tasks=previous_tasks,
        )

        task_date = (
            start_date
            + timedelta(
                days=len(created_tasks)
            )
        )

        task = StudyTask(
            user_id=current_user.id,
            title=task_details["title"],
            description=task_details["description"],
            task_date=task_date,
            task_time=None,
            duration=task_details["duration"],
            completed=False,
        )

        db.add(task)
        db.flush()

        created_tasks.append(
            {
                "id": task.id,
                "material_id": material_id,
                "title": task.title,
                "description": task.description,
                "task_date": task.task_date.isoformat(),
                "duration": task.duration,
                "priority": candidate.get(
                    "priority",
                    "medium",
                ),
                "priority_score": candidate.get(
                    "priority_score",
                    0,
                ),
                "quiz_score_trend": candidate.get(
                    "quiz_score_trend",
                    "insufficient_data",
                ),
                "recent_quiz_average": candidate.get(
                    "recent_quiz_average",
                ),
                "previous_quiz_average": candidate.get(
                    "previous_quiz_average",
                ),
                "quiz_score_change": candidate.get(
                    "quiz_score_change",
                ),
                "task_completion_rate": candidate.get(
                    "task_completion_rate",
                    0,
                ),
                "previous_adaptive_tasks": len(
                    previous_tasks
                ),
                "adaptive_reason": task_details["reason"],
            }
        )

        existing_material_ids.add(
            material_id
        )

    # ---------------------------------------------------------
    # STEP 6: Save everything
    # ---------------------------------------------------------

    db.commit()

    return {
        "message": (
            "Adaptive study plan generated successfully."
        ),
        "tasks_created": len(created_tasks),
        "plan_days": plan_days,
        "tasks": created_tasks,
    }