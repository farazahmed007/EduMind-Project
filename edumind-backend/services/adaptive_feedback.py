from datetime import date, timedelta

from sqlalchemy.orm import Session

from models.planner import StudyTask
from models.user import User


FEEDBACK_LOOKBACK_DAYS = 14


def _calculate_completion_rate(
    completed_count,
    total_count,
):
    if total_count <= 0:
        return 0.0

    return round(
        (completed_count / total_count) * 100,
        1,
    )


def _get_task_age(task):
    if not task.task_date:
        return None

    return (
        date.today() - task.task_date
    ).days


def analyze_planner_behavior(
    db: Session,
    current_user: User,
):
    """
    Analyze how the authenticated student interacts
    with planner tasks.

    This provides the feedback layer for the adaptive
    learning system.

    The analysis considers:
    - Completed tasks
    - Pending tasks
    - Overdue tasks
    - Recently completed tasks
    - Repeatedly unfinished tasks
    - Overall planner completion rate
    """

    today = date.today()

    start_date = (
        today -
        timedelta(
            days=FEEDBACK_LOOKBACK_DAYS
        )
    )

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id ==
            current_user.id,
            StudyTask.task_date >=
            start_date,
        )
        .order_by(
            StudyTask.task_date.asc()
        )
        .all()
    )

    total_tasks = len(tasks)

    completed_tasks = [
        task
        for task in tasks
        if task.completed
    ]

    pending_tasks = [
        task
        for task in tasks
        if not task.completed
    ]

    overdue_tasks = [
        task
        for task in pending_tasks
        if task.task_date < today
    ]

    upcoming_tasks = [
        task
        for task in pending_tasks
        if task.task_date >= today
    ]

    completion_rate = (
        _calculate_completion_rate(
            len(completed_tasks),
            total_tasks,
        )
    )

    material_task_counts = {}
    material_completed_counts = {}

    for task in tasks:
        material_id = None

        if task.description:
            marker = "[material_id:"

            if marker in task.description:
                try:
                    value = (
                        task.description
                        .split(marker, 1)[1]
                        .split("]", 1)[0]
                    )

                    material_id = int(
                        value
                    )
                except (
                    ValueError,
                    IndexError,
                ):
                    material_id = None

        if material_id is None:
            continue

        material_task_counts[
            material_id
        ] = (
            material_task_counts.get(
                material_id,
                0,
            ) + 1
        )

        if task.completed:
            material_completed_counts[
                material_id
            ] = (
                material_completed_counts.get(
                    material_id,
                    0,
                ) + 1
            )

    material_behavior = []

    for material_id, task_count in (
        material_task_counts.items()
    ):
        completed_count = (
            material_completed_counts.get(
                material_id,
                0,
            )
        )

        material_rate = (
            _calculate_completion_rate(
                completed_count,
                task_count,
            )
        )

        material_behavior.append(
            {
                "material_id": material_id,
                "assigned_tasks": task_count,
                "completed_tasks": completed_count,
                "completion_rate": material_rate,
            }
        )

    material_behavior.sort(
        key=lambda item: (
            item["completion_rate"],
            -item["assigned_tasks"],
        )
    )

    recently_completed = [
        {
            "id": task.id,
            "title": task.title,
            "task_date": (
                task.task_date.isoformat()
                if task.task_date
                else None
            ),
            "material_id": _extract_material_id(
                task
            ),
        }
        for task in completed_tasks
        if task.task_date
        >= (
            today -
            timedelta(days=7)
        )
    ]

    overdue_details = [
        {
            "id": task.id,
            "title": task.title,
            "task_date": (
                task.task_date.isoformat()
                if task.task_date
                else None
            ),
            "days_overdue": max(
                _get_task_age(task) or 0,
                0,
            ),
            "material_id": _extract_material_id(
                task
            ),
        }
        for task in overdue_tasks
    ]

    if completion_rate >= 85:
        behavior_status = "strong"
    elif completion_rate >= 60:
        behavior_status = "moderate"
    else:
        behavior_status = "needs_support"

    if len(overdue_tasks) >= 3:
        workload_signal = "too_high"
    elif len(overdue_tasks) > 0:
        workload_signal = "needs_attention"
    else:
        workload_signal = "manageable"

    return {
        "lookback_days": FEEDBACK_LOOKBACK_DAYS,
        "total_tasks": total_tasks,
        "completed_tasks": len(
            completed_tasks
        ),
        "pending_tasks": len(
            pending_tasks
        ),
        "overdue_tasks": len(
            overdue_tasks
        ),
        "upcoming_tasks": len(
            upcoming_tasks
        ),
        "completion_rate": completion_rate,
        "behavior_status": behavior_status,
        "workload_signal": workload_signal,
        "recently_completed": recently_completed,
        "overdue_details": overdue_details,
        "material_behavior": material_behavior,
    }


def _extract_material_id(task):
    """
    Extract the material ID stored by the adaptive
    plan generator in the task description.
    """

    if not task.description:
        return None

    marker = "[material_id:"

    if marker not in task.description:
        return None

    try:
        value = (
            task.description
            .split(marker, 1)[1]
            .split("]", 1)[0]
        )

        return int(value)

    except (
        ValueError,
        IndexError,
    ):
        return None


def generate_adaptive_feedback(
    db: Session,
    current_user: User,
):
    """
    Convert planner behavior into actionable signals
    for the next adaptive study plan.

    This function does not modify any database records.
    """

    analysis = analyze_planner_behavior(
        db=db,
        current_user=current_user,
    )

    recommendations = []

    completion_rate = (
        analysis["completion_rate"]
    )

    overdue_count = (
        analysis["overdue_tasks"]
    )

    behavior_status = (
        analysis["behavior_status"]
    )

    workload_signal = (
        analysis["workload_signal"]
    )

    if overdue_count >= 3:
        recommendations.append(
            {
                "type": "reduce_workload",
                "priority": "high",
                "message": (
                    "Several study tasks are overdue. "
                    "The next plan should reduce workload "
                    "and prioritize unfinished tasks."
                ),
            }
        )

    elif overdue_count > 0:
        recommendations.append(
            {
                "type": "recover_overdue",
                "priority": "high",
                "message": (
                    "Some study tasks are overdue. "
                    "The next plan should give unfinished "
                    "work additional attention."
                ),
            }
        )

    if completion_rate >= 85:
        recommendations.append(
            {
                "type": "increase_challenge",
                "priority": "medium",
                "message": (
                    "Study-plan completion is strong. "
                    "The next plan can maintain the workload "
                    "and gradually increase challenge."
                ),
            }
        )

    elif completion_rate >= 60:
        recommendations.append(
            {
                "type": "maintain_workload",
                "priority": "medium",
                "message": (
                    "Study-plan completion is moderate. "
                    "Keep the workload balanced and focus "
                    "on consistency."
                ),
            }
        )

    else:
        recommendations.append(
            {
                "type": "reduce_and_support",
                "priority": "high",
                "message": (
                    "Study-plan completion is low. "
                    "The next plan should contain fewer "
                    "tasks with stronger focus on priority "
                    "materials."
                ),
            }
        )

    if workload_signal == "too_high":
        recommendations.append(
            {
                "type": "schedule_recovery",
                "priority": "high",
                "message": (
                    "The number of overdue tasks suggests "
                    "that the current workload may be too "
                    "high. Schedule recovery before adding "
                    "more study tasks."
                ),
            }
        )

    if analysis["material_behavior"]:
        weakest_material = (
            analysis["material_behavior"][0]
        )

        if (
            weakest_material[
                "completion_rate"
            ] < 50
        ):
            recommendations.append(
                {
                    "type": "material_follow_up",
                    "priority": "medium",
                    "material_id": (
                        weakest_material[
                            "material_id"
                        ]
                    ),
                    "message": (
                        "A material has a low planner "
                        "completion rate. Consider assigning "
                        "shorter, more focused sessions for it."
                    ),
                }
            )

    return {
        "analysis": analysis,
        "recommendations": recommendations,
        "summary": {
            "behavior_status": behavior_status,
            "completion_rate": completion_rate,
            "overdue_tasks": overdue_count,
            "recommended_action": (
                recommendations[0]["type"]
                if recommendations
                else "maintain"
            ),
        },
    }