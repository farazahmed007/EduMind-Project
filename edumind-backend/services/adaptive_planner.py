from datetime import date, datetime, timedelta
import json
import re
from typing import Any

from sqlalchemy.orm import Session

from models.analytics import AnalyticsEvent
from models.material import Material
from models.planner import StudyTask
from models.user import User
from services.ai_service import ask_ai


# ==================================================
# CONFIGURATION
# ==================================================

RECENT_ACTIVITY_DAYS = 14

LOW_SCORE_THRESHOLD = 60.0
MEDIUM_SCORE_THRESHOLD = 75.0

MAX_RECOMMENDATIONS = 8

QUIZ_TREND_MIN_ATTEMPTS = 2

QUIZ_TREND_IMPROVING_THRESHOLD = 8.0
QUIZ_TREND_DECLINING_THRESHOLD = -8.0


# ==================================================
# HELPERS
# ==================================================

def _safe_percentage(
    score: float | None,
    total: int | None,
) -> float | None:
    """
    Convert a quiz score into a percentage safely.
    """

    if (
        score is None
        or total is None
        or total <= 0
    ):
        return None

    return (
        float(score)
        / float(total)
    ) * 100.0


def _days_since(
    timestamp: datetime | None,
) -> int | None:
    """
    Return the number of days since a timestamp.
    """

    if timestamp is None:
        return None

    now = (
        datetime.now(timestamp.tzinfo)
        if timestamp.tzinfo
        else datetime.now()
    )

    difference = now - timestamp

    return max(
        0,
        difference.days,
    )


def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    Keep a numeric value inside a range.
    """

    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def _extract_material_id(
    task: StudyTask,
) -> int | None:
    """
    Extract a material ID from an adaptive task.

    Adaptive tasks store the material relationship inside
    the description using:

        [material_id:123]

    Returns None for normal manually-created tasks.
    """

    description = task.description or ""

    match = re.search(
        r"\[material_id:(\d+)\]",
        description,
    )

    if not match:
        return None

    try:
        return int(
            match.group(1)
        )
    except ValueError:
        return None


# ==================================================
# LOAD USER DATA
# ==================================================

def _load_user_materials(
    db: Session,
    current_user: User,
) -> list[Material]:
    """
    Load only the current user's materials.
    """

    return (
        db.query(Material)
        .filter(
            Material.user_id == current_user.id
        )
        .order_by(
            Material.id.asc()
        )
        .all()
    )


def _load_user_quiz_events(
    db: Session,
    current_user: User,
) -> list[AnalyticsEvent]:
    """
    Load quiz events belonging to the current user.

    Analytics events are associated with users through their
    materials because AnalyticsEvent currently does not contain
    a direct user_id column.
    """

    return (
        db.query(AnalyticsEvent)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            Material.user_id == current_user.id,
            AnalyticsEvent.event_type == "quiz_completed",
        )
        .order_by(
            AnalyticsEvent.created_at.asc()
        )
        .all()
    )


def _load_user_flashcard_events(
    db: Session,
    current_user: User,
) -> list[AnalyticsEvent]:
    """
    Load flashcard activity belonging to the current user.
    """

    return (
        db.query(AnalyticsEvent)
        .join(
            Material,
            AnalyticsEvent.material_id == Material.id,
        )
        .filter(
            Material.user_id == current_user.id,
            AnalyticsEvent.event_type == "flashcards_reviewed",
        )
        .order_by(
            AnalyticsEvent.created_at.asc()
        )
        .all()
    )


def _load_user_tasks(
    db: Session,
    current_user: User,
) -> list[StudyTask]:
    """
    Load all planner tasks belonging to the current user.
    """

    return (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id
        )
        .order_by(
            StudyTask.task_date.asc(),
            StudyTask.created_at.asc(),
        )
        .all()
    )


# ==================================================
# QUIZ PERFORMANCE TREND
# ==================================================

def _calculate_quiz_trend(
    quiz_events: list[AnalyticsEvent],
) -> dict[str, Any]:
    """
    Compare recent quiz performance with previous performance.

    The goal is to detect whether the student's understanding
    appears to be:

    - improving
    - stable
    - declining

    At least two valid quiz attempts are required.
    """

    scored_attempts = []

    for event in quiz_events:
        percentage = _safe_percentage(
            event.score,
            event.total,
        )

        if percentage is None:
            continue

        scored_attempts.append(
            {
                "percentage": percentage,
                "created_at": event.created_at,
            }
        )

    if len(scored_attempts) < QUIZ_TREND_MIN_ATTEMPTS:
        return {
            "quiz_score_trend": "insufficient_data",
            "recent_quiz_average": None,
            "previous_quiz_average": None,
            "quiz_score_change": None,
        }

    scored_attempts.sort(
        key=lambda item: (
            item["created_at"]
            if item["created_at"] is not None
            else datetime.min
        )
    )

    # Compare the most recent attempt with the average
    # of previous attempts. This makes the signal responsive
    # even when the student has only a small history.
    latest_score = scored_attempts[-1]["percentage"]

    previous_scores = [
        item["percentage"]
        for item in scored_attempts[:-1]
    ]

    previous_average = (
        sum(previous_scores)
        / len(previous_scores)
    )

    score_change = (
        latest_score
        - previous_average
    )

    if (
        score_change
        >= QUIZ_TREND_IMPROVING_THRESHOLD
    ):
        trend = "improving"

    elif (
        score_change
        <= QUIZ_TREND_DECLINING_THRESHOLD
    ):
        trend = "declining"

    else:
        trend = "stable"

    return {
        "quiz_score_trend": trend,
        "recent_quiz_average": round(
            latest_score,
            1,
        ),
        "previous_quiz_average": round(
            previous_average,
            1,
        ),
        "quiz_score_change": round(
            score_change,
            1,
        ),
    }


# ==================================================
# MATERIAL PERFORMANCE
# ==================================================

def _build_material_profiles(
    materials: list[Material],
    quiz_events: list[AnalyticsEvent],
    flashcard_events: list[AnalyticsEvent],
    tasks: list[StudyTask],
) -> list[dict[str, Any]]:
    """
    Build a learning profile for every material.

    The profile combines:

    - quiz performance
    - quiz performance trend
    - number of quiz attempts
    - flashcard activity
    - most recent learning activity
    - incomplete planner tasks
    - completed planner tasks
    - task completion rate
    """

    quiz_by_material: dict[
        int,
        list[AnalyticsEvent],
    ] = {}

    flashcards_by_material: dict[
        int,
        list[AnalyticsEvent],
    ] = {}

    for event in quiz_events:
        if event.material_id is None:
            continue

        quiz_by_material.setdefault(
            event.material_id,
            [],
        ).append(event)

    for event in flashcard_events:
        if event.material_id is None:
            continue

        flashcards_by_material.setdefault(
            event.material_id,
            [],
        ).append(event)

    tasks_by_material_id: dict[
        int,
        list[StudyTask],
    ] = {}

    tasks_without_material_id: list[
        StudyTask
    ] = []

    for task in tasks:
        material_id = _extract_material_id(
            task
        )

        if material_id is not None:
            tasks_by_material_id.setdefault(
                material_id,
                [],
            ).append(task)
        else:
            tasks_without_material_id.append(
                task
            )

    profiles = []

    for material in materials:
        material_quizzes = quiz_by_material.get(
            material.id,
            [],
        )

        material_flashcards = (
            flashcards_by_material.get(
                material.id,
                [],
            )
        )

        scores = []

        for event in material_quizzes:
            percentage = _safe_percentage(
                event.score,
                event.total,
            )

            if percentage is not None:
                scores.append(
                    percentage
                )

        average_score = (
            sum(scores) / len(scores)
            if scores
            else None
        )

        quiz_trend = _calculate_quiz_trend(
            material_quizzes
        )

        latest_quiz_at = None

        if material_quizzes:
            latest_quiz_at = max(
                (
                    event.created_at
                    for event in material_quizzes
                    if event.created_at is not None
                ),
                default=None,
            )

        latest_flashcard_at = None

        if material_flashcards:
            latest_flashcard_at = max(
                (
                    event.created_at
                    for event in material_flashcards
                    if event.created_at is not None
                ),
                default=None,
            )

        activity_dates = [
            timestamp
            for timestamp in [
                latest_quiz_at,
                latest_flashcard_at,
            ]
            if timestamp is not None
        ]

        latest_activity_at = (
            max(activity_dates)
            if activity_dates
            else None
        )

        # --------------------------------------------------
        # MATERIAL-LINKED TASKS
        # --------------------------------------------------

        related_tasks = list(
            tasks_by_material_id.get(
                material.id,
                [],
            )
        )

        # Backward-compatible fallback for older manually
        # created tasks that don't have [material_id:X].
        material_title_lower = (
            material.title.strip().lower()
        )

        for task in tasks_without_material_id:
            task_title_lower = (
                task.title.strip().lower()
            )

            if (
                material_title_lower
                and (
                    material_title_lower
                    in task_title_lower
                    or task_title_lower
                    in material_title_lower
                )
            ):
                related_tasks.append(
                    task
                )

        total_related_tasks = len(
            related_tasks
        )

        completed_related_tasks = sum(
            1
            for task in related_tasks
            if task.completed
        )

        incomplete_related_tasks = (
            total_related_tasks
            - completed_related_tasks
        )

        task_completion_rate = (
            (
                completed_related_tasks
                / total_related_tasks
            )
            * 100.0
            if total_related_tasks > 0
            else None
        )

        profiles.append(
            {
                "material_id": material.id,
                "material_title": material.title,
                "material_type": material.type,

                "quiz_attempts": len(
                    material_quizzes
                ),

                "average_quiz_score": (
                    round(
                        average_score,
                        1,
                    )
                    if average_score is not None
                    else None
                ),

                "recent_quiz_average": (
                    quiz_trend[
                        "recent_quiz_average"
                    ]
                ),

                "previous_quiz_average": (
                    quiz_trend[
                        "previous_quiz_average"
                    ]
                ),

                "quiz_score_change": (
                    quiz_trend[
                        "quiz_score_change"
                    ]
                ),

                "quiz_score_trend": (
                    quiz_trend[
                        "quiz_score_trend"
                    ]
                ),

                "flashcard_sessions": len(
                    material_flashcards
                ),

                "flashcards_reviewed": sum(
                    event.item_count or 0
                    for event in material_flashcards
                ),

                "latest_activity": (
                    latest_activity_at.isoformat()
                    if latest_activity_at
                    else None
                ),

                "days_since_activity": (
                    _days_since(
                        latest_activity_at
                    )
                    if latest_activity_at
                    else None
                ),

                "total_related_tasks": (
                    total_related_tasks
                ),

                "completed_related_tasks": (
                    completed_related_tasks
                ),

                "incomplete_related_tasks": (
                    incomplete_related_tasks
                ),

                "task_completion_rate": (
                    round(
                        task_completion_rate,
                        1,
                    )
                    if task_completion_rate is not None
                    else None
                ),
            }
        )

    return profiles


# ==================================================
# PRIORITY SCORING
# ==================================================

def _calculate_priority_score(
    profile: dict[str, Any],
) -> float:
    """
    Calculate a deterministic learning priority score.

    Higher score means the student should prioritize
    this material more strongly.

    The score considers:

    1. Current quiz performance.
    2. Quiz performance trend.
    3. Lack of quiz history.
    4. Lack of recent activity.
    5. Low revision activity.
    6. Planner adherence.
    7. Existing unfinished work.

    This is the main feedback-loop component of the
    adaptive planner.
    """

    score = 0.0

    average_quiz_score = profile.get(
        "average_quiz_score"
    )

    quiz_attempts = profile.get(
        "quiz_attempts",
        0,
    )

    flashcard_sessions = profile.get(
        "flashcard_sessions",
        0,
    )

    flashcards_reviewed = profile.get(
        "flashcards_reviewed",
        0,
    )

    days_since_activity = profile.get(
        "days_since_activity"
    )

    incomplete_tasks = profile.get(
        "incomplete_related_tasks",
        0,
    )

    completed_tasks = profile.get(
        "completed_related_tasks",
        0,
    )

    task_completion_rate = profile.get(
        "task_completion_rate"
    )

    quiz_score_trend = profile.get(
        "quiz_score_trend",
        "insufficient_data",
    )

    quiz_score_change = profile.get(
        "quiz_score_change"
    )

    # --------------------------------------------------
    # Current quiz weakness
    # --------------------------------------------------

    if average_quiz_score is None:
        score += 35.0

    elif average_quiz_score < LOW_SCORE_THRESHOLD:
        score += 50.0

    elif average_quiz_score < MEDIUM_SCORE_THRESHOLD:
        score += 30.0

    elif average_quiz_score < 85.0:
        score += 12.0

    else:
        score += 2.0

    # --------------------------------------------------
    # Limited assessment history
    # --------------------------------------------------

    if quiz_attempts == 0:
        score += 15.0

    elif quiz_attempts == 1:
        score += 8.0

    # --------------------------------------------------
    # Quiz performance trend
    # --------------------------------------------------

    if quiz_score_trend == "declining":
        score += 15.0

    elif quiz_score_trend == "improving":
        score -= 12.0

    # --------------------------------------------------
    # Inactivity
    # --------------------------------------------------

    if days_since_activity is None:
        score += 30.0

    elif days_since_activity >= 14:
        score += 35.0

    elif days_since_activity >= 7:
        score += 25.0

    elif days_since_activity >= 3:
        score += 10.0

    # --------------------------------------------------
    # Revision activity
    # --------------------------------------------------

    if flashcard_sessions == 0:
        score += 12.0

    elif flashcards_reviewed < 10:
        score += 7.0

    # --------------------------------------------------
    # Planner behavior
    # --------------------------------------------------

    if task_completion_rate is not None:

        # Strong adherence means the student is keeping
        # up with the generated workload.
        if (
            task_completion_rate >= 80.0
            and completed_tasks >= 2
        ):
            score -= 8.0

        # Low adherence means the system should be careful
        # about adding too much new workload.
        elif task_completion_rate < 50.0:
            score += 8.0

    # --------------------------------------------------
    # Existing unfinished work
    # --------------------------------------------------

    score += min(
        15.0,
        incomplete_tasks * 5.0,
    )

    # --------------------------------------------------
    # Avoid overreacting to a single small trend
    # --------------------------------------------------

    if (
        quiz_score_change is not None
        and abs(quiz_score_change) < 3.0
    ):
        score -= 0.0

    return round(
        _clamp(
            score,
            0.0,
            100.0,
        ),
        1,
    )


def _classify_priority(
    priority_score: float,
) -> str:
    """
    Convert the numeric priority into a readable level.
    """

    if priority_score >= 70:
        return "high"

    if priority_score >= 40:
        return "medium"

    return "low"


# ==================================================
# RECOMMENDATION ACTION
# ==================================================

def _build_recommendation_action(
    profile: dict[str, Any],
    priority_level: str,
) -> str:
    """
    Create a deterministic baseline recommendation.

    Ollama will later turn this into natural language.
    """

    average_score = profile.get(
        "average_quiz_score"
    )

    quiz_attempts = profile.get(
        "quiz_attempts",
        0,
    )

    flashcard_sessions = profile.get(
        "flashcard_sessions",
        0,
    )

    days_since_activity = profile.get(
        "days_since_activity"
    )

    quiz_score_trend = profile.get(
        "quiz_score_trend",
        "insufficient_data",
    )

    task_completion_rate = profile.get(
        "task_completion_rate"
    )

    incomplete_tasks = profile.get(
        "incomplete_related_tasks",
        0,
    )

    # --------------------------------------------------
    # Declining performance
    # --------------------------------------------------

    if quiz_score_trend == "declining":
        return (
            "Review the weaker concepts, then take "
            "another practice quiz to check progress."
        )

    # --------------------------------------------------
    # Very low performance
    # --------------------------------------------------

    if (
        average_score is not None
        and average_score < 60
    ):
        return (
            "Review the material and take another "
            "practice quiz."
        )

    # --------------------------------------------------
    # Moderate performance
    # --------------------------------------------------

    if (
        average_score is not None
        and average_score < 75
    ):
        return (
            "Revise the weaker concepts and complete "
            "a medium-difficulty quiz."
        )

    # --------------------------------------------------
    # No assessment history
    # --------------------------------------------------

    if quiz_attempts == 0:
        return (
            "Study the material and complete an initial "
            "quiz to measure understanding."
        )

    # --------------------------------------------------
    # Improving performance
    # --------------------------------------------------

    if quiz_score_trend == "improving":
        return (
            "Your recent performance is improving. "
            "Use a short revision session and then "
            "try a slightly more challenging quiz."
        )

    # --------------------------------------------------
    # Inactivity
    # --------------------------------------------------

    if (
        days_since_activity is None
        or days_since_activity >= 7
    ):
        return (
            "Review this material to refresh your memory."
        )

    # --------------------------------------------------
    # Missing flashcard practice
    # --------------------------------------------------

    if flashcard_sessions == 0:
        return (
            "Use flashcards for active recall and then "
            "test yourself."
        )

    # --------------------------------------------------
    # Low planner adherence
    # --------------------------------------------------

    if (
        task_completion_rate is not None
        and task_completion_rate < 50.0
        and incomplete_tasks > 0
    ):
        return (
            "Complete the unfinished study work before "
            "adding more workload."
        )

    # --------------------------------------------------
    # High priority
    # --------------------------------------------------

    if priority_level == "high":
        return (
            "Schedule a focused revision session and "
            "practice questions."
        )

    # --------------------------------------------------
    # Medium priority
    # --------------------------------------------------

    if priority_level == "medium":
        return (
            "Do a short revision session and review "
            "key concepts."
        )

    # --------------------------------------------------
    # Low priority
    # --------------------------------------------------

    return (
        "Maintain your understanding with light revision."
    )


# ==================================================
# PREPARE LEARNING ANALYSIS
# ==================================================

def analyze_learning_profile(
    db: Session,
    current_user: User,
) -> dict[str, Any]:
    """
    Analyze the current user's learning data.

    This function does not call the LLM.

    It produces reliable structured data that the
    recommendation engine can safely provide to the LLM.

    The analysis is recalculated from the latest database
    state every time the adaptive planner is requested.
    """

    materials = _load_user_materials(
        db,
        current_user,
    )

    quiz_events = _load_user_quiz_events(
        db,
        current_user,
    )

    flashcard_events = _load_user_flashcard_events(
        db,
        current_user,
    )

    tasks = _load_user_tasks(
        db,
        current_user,
    )

    profiles = _build_material_profiles(
        materials=materials,
        quiz_events=quiz_events,
        flashcard_events=flashcard_events,
        tasks=tasks,
    )

    for profile in profiles:
        priority_score = _calculate_priority_score(
            profile
        )

        priority_level = _classify_priority(
            priority_score
        )

        profile["priority_score"] = (
            priority_score
        )

        profile["priority_level"] = (
            priority_level
        )

        profile["recommended_action"] = (
            _build_recommendation_action(
                profile,
                priority_level,
            )
        )

    profiles.sort(
        key=lambda item: (
            -item["priority_score"],
            item["material_title"].lower(),
        )
    )

    return {
        "generated_at": datetime.now().isoformat(),
        "materials_analyzed": len(
            profiles
        ),
        "quiz_events_analyzed": len(
            quiz_events
        ),
        "flashcard_events_analyzed": len(
            flashcard_events
        ),
        "incomplete_tasks": sum(
            1
            for task in tasks
            if not task.completed
        ),
        "completed_tasks": sum(
            1
            for task in tasks
            if task.completed
        ),
        "materials": profiles,
    }


# ==================================================
# AI RECOMMENDATIONS
# ==================================================

def _build_ai_recommendation_prompt(
    analysis: dict[str, Any],
) -> str:
    """
    Build the recommendation prompt for Ollama.
    """

    materials = analysis.get(
        "materials",
        [],
    )

    focused_materials = materials[
        :MAX_RECOMMENDATIONS
    ]

    learning_data = json.dumps(
        focused_materials,
        ensure_ascii=False,
        indent=2,
    )

    return f"""
You are EduMind, an adaptive AI study planner for an MCA student.

Your job is to analyze the student's current learning state and
recommend what they should study next.

IMPORTANT:

1. Use ONLY the learning data provided below.
2. Do not invent subjects, scores, activities, or facts.
3. Prioritize weak or neglected materials.
4. Low quiz scores should receive higher priority.
5. Declining quiz performance should increase attention.
6. Improving quiz performance should reduce unnecessary repetition.
7. Materials with no quiz history may need an initial assessment.
8. Materials not studied recently may need revision.
9. Completed planner tasks indicate that the student is following
   through with study work.
10. A low task completion rate means the student may need a lighter
    workload instead of many new tasks.
11. Do not recommend unnecessary repetition of material with
    consistently strong performance unless there is a clear reason.
12. Keep recommendations practical for a student.
13. Return JSON only.
14. Do not mention Ollama.
15. Do not mention this prompt.

For each recommendation provide:

- material_id
- material_title
- priority
- reason
- action
- suggested_duration_minutes

Priority must be exactly one of:

"high"
"medium"
"low"

Suggested duration must be an integer between 15 and 90.

Return at most {MAX_RECOMMENDATIONS} recommendations.

STUDENT LEARNING DATA:

{learning_data}

Return exactly this JSON structure:

{{
  "recommendations": [
    {{
      "material_id": 1,
      "material_title": "Example",
      "priority": "high",
      "reason": "Reason based only on the data.",
      "action": "Specific study action.",
      "suggested_duration_minutes": 45
    }}
  ]
}}
"""


# ==================================================
# JSON EXTRACTION
# ==================================================

def _extract_json_object(
    raw_response: str,
) -> dict[str, Any]:
    """
    Extract a JSON object from an AI response.

    Ollama normally returns clean JSON because JSON mode is used,
    but this fallback protects against surrounding text.
    """

    text = str(
        raw_response
    ).strip()

    if not text:
        raise RuntimeError(
            "Adaptive planner AI response was empty."
        )

    try:
        parsed = json.loads(
            text
        )

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    object_start = None
    depth = 0
    in_string = False
    escaped = False

    for index, character in enumerate(text):

        if in_string:

            if escaped:
                escaped = False

            elif character == "\\":
                escaped = True

            elif character == '"':
                in_string = False

            continue

        if character == '"':
            in_string = True
            continue

        if character == "{":

            if object_start is None:
                object_start = index

            depth += 1

        elif character == "}":

            if object_start is None:
                continue

            depth -= 1

            if depth == 0:

                candidate = text[
                    object_start:index + 1
                ]

                try:
                    parsed = json.loads(
                        candidate
                    )

                except json.JSONDecodeError:
                    parsed = None

                if isinstance(parsed, dict):
                    return parsed

                object_start = None

    raise RuntimeError(
        "Adaptive planner AI response did not contain valid JSON."
    )


# ==================================================
# VALIDATE AI RECOMMENDATIONS
# ==================================================

def _validate_ai_recommendations(
    recommendations: Any,
    profiles: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Validate and normalize AI-generated recommendations.

    The AI is never allowed to introduce a material that does not
    exist in the user's actual learning profile.
    """

    if not isinstance(
        recommendations,
        list,
    ):
        raise RuntimeError(
            "Adaptive planner recommendations must be a list."
        )

    valid_materials = {
        profile["material_id"]: profile
        for profile in profiles
    }

    validated = []

    seen_material_ids = set()

    for item in recommendations:

        if not isinstance(
            item,
            dict,
        ):
            continue

        try:
            material_id = int(
                item.get("material_id")
            )

        except (
            TypeError,
            ValueError,
        ):
            continue

        if material_id not in valid_materials:
            continue

        if material_id in seen_material_ids:
            continue

        priority = str(
            item.get(
                "priority",
                "",
            )
        ).strip().lower()

        if priority not in {
            "high",
            "medium",
            "low",
        }:
            priority = valid_materials[
                material_id
            ]["priority_level"]

        reason = str(
            item.get(
                "reason",
                "",
            )
        ).strip()

        action = str(
            item.get(
                "action",
                "",
            )
        ).strip()

        if not reason:
            reason = (
                "This material has been identified "
                "as a useful next study target."
            )

        if not action:
            action = valid_materials[
                material_id
            ]["recommended_action"]

        try:
            duration = int(
                item.get(
                    "suggested_duration_minutes",
                    45,
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            duration = 45

        duration = int(
            _clamp(
                float(duration),
                15.0,
                90.0,
            )
        )

        profile = valid_materials[
            material_id
        ]

        validated.append(
            {
                "material_id": material_id,
                "material_title": profile[
                    "material_title"
                ],
                "priority": priority,
                "reason": reason,
                "action": action,
                "suggested_duration_minutes": duration,

                "priority_score": profile[
                    "priority_score"
                ],

                "average_quiz_score": profile[
                    "average_quiz_score"
                ],

                "recent_quiz_average": profile[
                    "recent_quiz_average"
                ],

                "previous_quiz_average": profile[
                    "previous_quiz_average"
                ],

                "quiz_score_change": profile[
                    "quiz_score_change"
                ],

                "quiz_score_trend": profile[
                    "quiz_score_trend"
                ],

                "quiz_attempts": profile[
                    "quiz_attempts"
                ],

                "days_since_activity": profile[
                    "days_since_activity"
                ],

                "total_related_tasks": profile[
                    "total_related_tasks"
                ],

                "completed_related_tasks": profile[
                    "completed_related_tasks"
                ],

                "incomplete_related_tasks": profile[
                    "incomplete_related_tasks"
                ],

                "task_completion_rate": profile[
                    "task_completion_rate"
                ],
            }
        )

        seen_material_ids.add(
            material_id
        )

        if len(validated) >= MAX_RECOMMENDATIONS:
            break

    return validated


# ==================================================
# GET ADAPTIVE RECOMMENDATIONS
# ==================================================

def generate_recommendations(
    db: Session,
    current_user: User,
) -> dict[str, Any]:
    """
    Generate personalized study recommendations.

    Deterministic analysis decides which materials deserve
    attention. Ollama then converts those findings into useful
    student-facing recommendations.

    The analysis is performed from the latest database state,
    meaning new quiz results and completed planner tasks can
    change future recommendations.
    """

    analysis = analyze_learning_profile(
        db,
        current_user,
    )

    profiles = analysis.get(
        "materials",
        [],
    )

    if not profiles:
        return {
            "generated_at": analysis[
                "generated_at"
            ],
            "recommendations": [],
            "message": (
                "Upload study materials and start "
                "learning to receive adaptive recommendations."
            ),
        }

    prompt = _build_ai_recommendation_prompt(
        analysis
    )

    raw_response = ask_ai(
        prompt,
        json_mode=True,
    )

    parsed = _extract_json_object(
        raw_response
    )

    recommendations = _validate_ai_recommendations(
        parsed.get(
            "recommendations",
            [],
        ),
        profiles,
    )

    # --------------------------------------------------
    # Safety fallback
    # --------------------------------------------------

    if not recommendations:
        fallback_profiles = profiles[
            :MAX_RECOMMENDATIONS
        ]

        recommendations = [
            {
                "material_id": profile[
                    "material_id"
                ],

                "material_title": profile[
                    "material_title"
                ],

                "priority": profile[
                    "priority_level"
                ],

                "reason": (
                    "This material has a learning priority "
                    f"score of {profile['priority_score']}."
                ),

                "action": profile[
                    "recommended_action"
                ],

                "suggested_duration_minutes": 45,

                "priority_score": profile[
                    "priority_score"
                ],

                "average_quiz_score": profile[
                    "average_quiz_score"
                ],

                "recent_quiz_average": profile[
                    "recent_quiz_average"
                ],

                "previous_quiz_average": profile[
                    "previous_quiz_average"
                ],

                "quiz_score_change": profile[
                    "quiz_score_change"
                ],

                "quiz_score_trend": profile[
                    "quiz_score_trend"
                ],

                "quiz_attempts": profile[
                    "quiz_attempts"
                ],

                "days_since_activity": profile[
                    "days_since_activity"
                ],

                "total_related_tasks": profile[
                    "total_related_tasks"
                ],

                "completed_related_tasks": profile[
                    "completed_related_tasks"
                ],

                "incomplete_related_tasks": profile[
                    "incomplete_related_tasks"
                ],

                "task_completion_rate": profile[
                    "task_completion_rate"
                ],
            }
            for profile in fallback_profiles
        ]

    return {
        "generated_at": analysis[
            "generated_at"
        ],
        "recommendations": recommendations,
    }


# ==================================================
# PLAN SUPPORT
# ==================================================

def get_plan_candidates(
    db: Session,
    current_user: User,
) -> list[dict[str, Any]]:
    """
    Return prioritized materials that can be used by the
    automatic study-plan generator.

    This is intentionally separate from task creation.

    The candidates are recalculated from the user's current
    learning state each time this function is called.
    """

    analysis = analyze_learning_profile(
        db,
        current_user,
    )

    candidates = []

    for profile in analysis.get(
        "materials",
        [],
    ):

        candidates.append(
            {
                "material_id": profile[
                    "material_id"
                ],

                "material_title": profile[
                    "material_title"
                ],

                "priority": profile[
                    "priority_level"
                ],

                "priority_score": profile[
                    "priority_score"
                ],

                "average_quiz_score": profile[
                    "average_quiz_score"
                ],

                "recent_quiz_average": profile[
                    "recent_quiz_average"
                ],

                "previous_quiz_average": profile[
                    "previous_quiz_average"
                ],

                "quiz_score_change": profile[
                    "quiz_score_change"
                ],

                "quiz_score_trend": profile[
                    "quiz_score_trend"
                ],

                "quiz_attempts": profile[
                    "quiz_attempts"
                ],

                "days_since_activity": profile[
                    "days_since_activity"
                ],

                "total_related_tasks": profile[
                    "total_related_tasks"
                ],

                "completed_related_tasks": profile[
                    "completed_related_tasks"
                ],

                "incomplete_related_tasks": profile[
                    "incomplete_related_tasks"
                ],

                "task_completion_rate": profile[
                    "task_completion_rate"
                ],

                "recommended_action": profile[
                    "recommended_action"
                ],
            }
        )

    return candidates