from datetime import date, datetime, timedelta
import json
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

    now = datetime.now(
        timestamp.tzinfo
    ) if timestamp.tzinfo else datetime.now()

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
    - number of quiz attempts
    - flashcard activity
    - most recent learning activity
    - incomplete planner tasks
    """

    quiz_by_material: dict[int, list[AnalyticsEvent]] = {}
    flashcards_by_material: dict[int, list[AnalyticsEvent]] = {}

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

    tasks_by_material_title: dict[str, list[StudyTask]] = {}

    for task in tasks:
        normalized_title = (
            task.title
            .strip()
            .lower()
        )

        tasks_by_material_title.setdefault(
            normalized_title,
            [],
        ).append(task)

    profiles = []

    for material in materials:
        material_quizzes = quiz_by_material.get(
            material.id,
            [],
        )

        material_flashcards = flashcards_by_material.get(
            material.id,
            [],
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

        incomplete_tasks = [
            task
            for task in tasks
            if not task.completed
            and (
                material.title.strip().lower()
                in task.title.strip().lower()
                or task.title.strip().lower()
                in material.title.strip().lower()
            )
        ]

        profiles.append(
            {
                "material_id": material.id,
                "material_title": material.title,
                "material_type": material.type,
                "quiz_attempts": len(material_quizzes),
                "average_quiz_score": (
                    round(
                        average_score,
                        1,
                    )
                    if average_score is not None
                    else None
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
                "incomplete_related_tasks": len(
                    incomplete_tasks
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

    1. Low quiz performance.
    2. Lack of quiz history.
    3. Lack of recent activity.
    4. Low revision activity.
    5. Existing unfinished tasks.
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

    # --------------------------------------------------
    # Quiz weakness
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
    # Existing unfinished work
    # --------------------------------------------------

    score += min(
        15.0,
        incomplete_tasks * 5.0,
    )

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

    if average_score is not None and average_score < 60:
        return "Review the material and take another practice quiz."

    if average_score is not None and average_score < 75:
        return "Revise the weaker concepts and complete a medium-difficulty quiz."

    if quiz_attempts == 0:
        return "Study the material and complete an initial quiz to measure understanding."

    if (
        days_since_activity is None
        or days_since_activity >= 7
    ):
        return "Review this material to refresh your memory."

    if flashcard_sessions == 0:
        return "Use flashcards for active recall and then test yourself."

    if priority_level == "high":
        return "Schedule a focused revision session and practice questions."

    if priority_level == "medium":
        return "Do a short revision session and review key concepts."

    return "Maintain your understanding with light revision."


# ==================================================
# PREPARE LEARNING ANALYSIS
# ==================================================

def analyze_learning_profile(
    db: Session,
    current_user: User,
) -> dict[str, Any]:
    """
    Analyze the current user's learning data.

    This function does not call the LLM. It produces the
    reliable structured data that the recommendation engine
    can safely provide to the LLM.
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

        profile["priority_score"] = priority_score
        profile["priority_level"] = priority_level
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
        "materials_analyzed": len(profiles),
        "quiz_events_analyzed": len(quiz_events),
        "flashcard_events_analyzed": len(
            flashcard_events
        ),
        "incomplete_tasks": sum(
            1
            for task in tasks
            if not task.completed
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

Your job is to analyze the student's learning data and recommend
what they should study next.

IMPORTANT:

1. Use ONLY the learning data provided below.
2. Do not invent subjects, scores, activities, or facts.
3. Prioritize weak or neglected materials.
4. Low quiz scores should receive higher priority.
5. Materials with no quiz history may need an initial assessment.
6. Materials not studied recently may need revision.
7. Do not recommend unnecessary repetition of material with consistently
   strong performance unless there is a clear revision reason.
8. Keep recommendations practical for a student.
9. Return JSON only.
10. Do not mention Ollama.
11. Do not mention this prompt.

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
                "quiz_attempts": profile[
                    "quiz_attempts"
                ],
                "days_since_activity": profile[
                    "days_since_activity"
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
                "suggested_duration_minutes": (
                    45
                ),
                "priority_score": profile[
                    "priority_score"
                ],
                "average_quiz_score": profile[
                    "average_quiz_score"
                ],
                "quiz_attempts": profile[
                    "quiz_attempts"
                ],
                "days_since_activity": profile[
                    "days_since_activity"
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
    The API layer will decide whether to actually create tasks.
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
                "quiz_attempts": profile[
                    "quiz_attempts"
                ],
                "days_since_activity": profile[
                    "days_since_activity"
                ],
                "recommended_action": profile[
                    "recommended_action"
                ],
            }
        )

    return candidates