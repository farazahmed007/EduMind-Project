from datetime import date, timedelta

from sqlalchemy.orm import Session

from models.planner import StudyTask
from models.user import User
from services.adaptive_feedback import (
    generate_adaptive_feedback,
)
from services.adaptive_planner import (
    get_plan_candidates,
)


DEFAULT_TASK_DURATION = 45
MAX_GENERATED_TASKS = 7


def _build_task_title(candidate):
    material_title = candidate.get(
        "title",
        "Study material",
    )

    priority = candidate.get(
        "priority",
        "medium",
    )

    if priority == "high":
        return f"Priority study: {material_title}"

    if priority == "medium":
        return f"Review: {material_title}"

    return f"Practice: {material_title}"


def _build_task_description(candidate):
    reasons = candidate.get(
        "reasons",
        [],
    )

    if not reasons:
        return (
            "Adaptive study session recommended based on "
            "your recent learning activity."
        )

    reason_text = "; ".join(reasons)

    return (
        "Adaptive study session based on your learning "
        f"activity. Focus areas: {reason_text}"
    )


def _get_task_duration(candidate):
    priority = candidate.get(
        "priority",
        "medium",
    )

    if priority == "high":
        return 60

    if priority == "medium":
        return 45

    return 30


def _get_existing_material_task(
    db: Session,
    current_user: User,
    material_id: int,
):
    return (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.description.isnot(None),
            StudyTask.description.like(
                f"%material_id:{material_id}%"
            ),
            StudyTask.completed.is_(False),
        )
        .first()
    )


def _get_material_completion_rates(feedback):
    """
    Convert planner feedback into a simple lookup:

        material_id -> completion rate
    """

    rates = {}

    analysis = feedback.get(
        "analysis",
        {},
    )

    material_behavior = analysis.get(
        "material_behavior",
        [],
    )

    for item in material_behavior:
        material_id = item.get(
            "material_id"
        )

        if material_id is None:
            continue

        rates[material_id] = item.get(
            "completion_rate",
            100,
        )

    return rates


def _prioritize_candidates(
    candidates,
    feedback,
):
    """
    Re-rank adaptive plan candidates using actual
    planner behavior.

    Materials that the student repeatedly fails to
    complete receive additional priority.

    Existing adaptive priority remains important, so
    planner behavior adjusts the ranking rather than
    completely replacing the learning analysis.
    """

    material_completion_rates = (
        _get_material_completion_rates(
            feedback
        )
    )

    def candidate_score(candidate):
        material_id = candidate.get(
            "material_id"
        )

        priority = candidate.get(
            "priority",
            "medium",
        )

        priority_score = {
            "high": 3,
            "medium": 2,
            "low": 1,
        }.get(
            priority,
            1,
        )

        completion_rate = (
            material_completion_rates.get(
                material_id,
                100,
            )
        )

        behavior_bonus = 0

        if completion_rate < 50:
            behavior_bonus = 3

        elif completion_rate < 70:
            behavior_bonus = 2

        elif completion_rate < 85:
            behavior_bonus = 1

        return (
            priority_score +
            behavior_bonus
        )

    return sorted(
        candidates,
        key=candidate_score,
        reverse=True,
    )


def _get_max_tasks(feedback):
    """
    Adapt the amount of new work based on how well
    the student is following the current plan.
    """

    analysis = feedback.get(
        "analysis",
        {},
    )

    behavior_status = analysis.get(
        "behavior_status",
        "moderate",
    )

    overdue_tasks = analysis.get(
        "overdue_tasks",
        0,
    )

    if overdue_tasks >= 3:
        return 3

    if behavior_status == "needs_support":
        return 3

    if behavior_status == "moderate":
        return 5

    return MAX_GENERATED_TASKS


def _adjust_task_duration(
    candidate,
    feedback,
):
    """
    Adapt study-session duration based on planner
    behavior.

    Strong adherence:
        Slightly increase challenge.

    Moderate adherence:
        Keep normal duration.

    Low adherence:
        Shorten sessions to make the plan easier
        to follow consistently.
    """

    base_duration = _get_task_duration(
        candidate
    )

    analysis = feedback.get(
        "analysis",
        {},
    )

    behavior_status = analysis.get(
        "behavior_status",
        "moderate",
    )

    overdue_tasks = analysis.get(
        "overdue_tasks",
        0,
    )

    if overdue_tasks >= 3:
        return max(
            base_duration - 15,
            20,
        )

    if behavior_status == "needs_support":
        return max(
            base_duration - 15,
            20,
        )

    if behavior_status == "strong":
        return min(
            base_duration + 10,
            90,
        )

    return base_duration


def generate_adaptive_plan(
    db: Session,
    current_user: User,
    start_date: date | None = None,
    number_of_days: int = 7,
):
    """
    Generate an adaptive study plan for the
    authenticated user.

    The plan combines:

    1. Learning-performance analysis.
    2. Material priorities.
    3. Actual planner behavior.
    4. Task completion patterns.
    5. Overdue-task signals.

    The function:
    - Prioritizes the user's learning materials.
    - Adapts workload based on planner behavior.
    - Adapts session duration.
    - Creates StudyTask records.
    - Avoids duplicate unfinished tasks for
      the same material.
    - Distributes tasks across the requested
      number of days.
    """

    if start_date is None:
        start_date = date.today()

    if number_of_days < 1:
        raise ValueError(
            "number_of_days must be at least 1."
        )

    if number_of_days > 30:
        raise ValueError(
            "number_of_days cannot be greater than 30."
        )

    # ==================================================
    # ANALYZE CURRENT PLANNER BEHAVIOR
    # ==================================================

    feedback = generate_adaptive_feedback(
        db=db,
        current_user=current_user,
    )

    # ==================================================
    # GET LEARNING PRIORITIES
    # ==================================================

    candidates = get_plan_candidates(
        db=db,
        current_user=current_user,
    )

    if not candidates:
        return {
            "message": (
                "No learning materials are available "
                "for adaptive plan generation."
            ),
            "created_tasks": [],
            "count": 0,
            "feedback": feedback,
        }

    # ==================================================
    # ADAPT CANDIDATE ORDER
    # ==================================================

    prioritized_candidates = (
        _prioritize_candidates(
            candidates=candidates,
            feedback=feedback,
        )
    )

    # ==================================================
    # ADAPT WORKLOAD
    # ==================================================

    max_tasks = _get_max_tasks(
        feedback
    )

    selected_candidates = (
        prioritized_candidates[
            :max_tasks
        ]
    )

    # ==================================================
    # CREATE TASKS
    # ==================================================

    created_tasks = []

    for index, candidate in enumerate(
        selected_candidates
    ):
        material_id = candidate.get(
            "material_id"
        )

        if material_id is None:
            continue

        # --------------------------------------------------
        # Prevent duplicate unfinished tasks
        # --------------------------------------------------

        existing_task = (
            _get_existing_material_task(
                db=db,
                current_user=current_user,
                material_id=material_id,
            )
        )

        if existing_task is not None:
            continue

        # --------------------------------------------------
        # Distribute tasks across the plan period
        # --------------------------------------------------

        task_date = (
            start_date +
            timedelta(
                days=index % number_of_days
            )
        )

        duration = _adjust_task_duration(
            candidate=candidate,
            feedback=feedback,
        )

        task = StudyTask(
            user_id=current_user.id,
            title=_build_task_title(
                candidate
            ),
            description=(
                f"{_build_task_description(candidate)} "
                f"[material_id:{material_id}]"
            ),
            task_date=task_date,
            task_time=None,
            duration=duration,
            completed=False,
        )

        db.add(task)
        db.flush()

        created_tasks.append(
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "task_date": (
                    task.task_date.isoformat()
                ),
                "task_time": task.task_time,
                "duration": task.duration,
                "completed": task.completed,
                "material_id": material_id,
                "priority": candidate.get(
                    "priority",
                    "medium",
                ),
            }
        )

    # ==================================================
    # SAVE
    # ==================================================

    db.commit()

    # ==================================================
    # RETURN ADAPTIVE RESULT
    # ==================================================

    analysis = feedback.get(
        "analysis",
        {},
    )

    return {
        "message": (
            "Adaptive study plan generated successfully."
        ),
        "created_tasks": created_tasks,
        "count": len(created_tasks),
        "start_date": start_date.isoformat(),
        "number_of_days": number_of_days,
        "adaptation": {
            "behavior_status": analysis.get(
                "behavior_status"
            ),
            "completion_rate": analysis.get(
                "completion_rate"
            ),
            "overdue_tasks": analysis.get(
                "overdue_tasks"
            ),
            "workload_signal": analysis.get(
                "workload_signal"
            ),
            "max_tasks_selected": max_tasks,
        },
    }