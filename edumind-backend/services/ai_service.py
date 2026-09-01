import json
import re
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from difflib import SequenceMatcher

import pymupdf


# ==================================================
# CONFIGURATION
# ==================================================

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"


# ==================================================
# PDF TEXT EXTRACTION
# ==================================================

def extract_pdf_text(
    file_path: str,
) -> str:
    """
    Extract all readable text from a PDF file.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {file_path}"
        )

    text_parts = []

    document = pymupdf.open(path)

    try:

        for page in document:

            page_text = page.get_text()

            if page_text:
                text_parts.append(page_text)

    finally:

        document.close()

    text = "\n".join(
        text_parts
    ).strip()

    if not text:

        raise ValueError(
            "No readable text could be extracted from this PDF."
        )

    return text


# ==================================================
# OLLAMA AI REQUEST
# ==================================================

def ask_ai(
    prompt: str,
    json_mode: bool = False,
) -> str:
    """
    Send a prompt to the local Ollama LLM.

    json_mode=True asks Ollama to return JSON using
    its native JSON output mode.
    """

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    if json_mode:
        payload["format"] = "json"

    data = json.dumps(
        payload,
        ensure_ascii=False,
    ).encode("utf-8")

    request = Request(
        OLLAMA_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:

        with urlopen(
            request,
            timeout=180,
        ) as response:

            response_data = response.read().decode(
                "utf-8"
            )

    except HTTPError as error:

        error_body = error.read().decode(
            "utf-8",
            errors="replace",
        )

        raise RuntimeError(
            f"Ollama returned HTTP {error.code}: {error_body}"
        ) from error

    except URLError as error:

        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running on your computer."
        ) from error

    except TimeoutError as error:

        raise RuntimeError(
            "Ollama took too long to generate a response."
        ) from error

    try:

        result = json.loads(
            response_data
        )

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "Ollama returned an invalid API response."
        ) from error

    answer = result.get(
        "response"
    )

    if not answer:

        raise RuntimeError(
            "Ollama returned an empty AI response."
        )

    return answer.strip()


# ==================================================
# SUMMARY
# ==================================================

def generate_summary(
    file_path: str,
) -> str:
    """
    Generate an AI summary from a PDF.
    """

    text = extract_pdf_text(
        file_path
    )

    max_characters = 30000

    if len(text) > max_characters:

        text = text[
            :max_characters
        ]

    prompt = f"""
You are EduMind, an AI study assistant designed for MCA students.

Your task is to summarize the study material provided below.

IMPORTANT RULES:

1. Base the summary ONLY on the provided study material.
2. Do not invent facts that are not present in the material.
3. Organize the response using clear headings.
4. Explain important concepts in simple language.
5. Include important definitions.
6. Include important points that a student should remember.
7. If the material contains multiple topics or units, organize the summary accordingly.
8. Keep the summary concise but useful for exam preparation.
9. Do not mention that you are a local AI.
10. Do not mention Ollama.
11. Do not mention this prompt.

STUDY MATERIAL:

<STUDY_MATERIAL>
{text}
</STUDY_MATERIAL>

Now create the summary of the study material above.

Use this structure where appropriate:

## Summary

### Main Concepts

- Important concept
- Important concept

### Key Definitions

- Definition
- Definition

### Important Points

- Point
- Point

### Exam Focus

- Important topic
- Important topic
"""

    return ask_ai(
        prompt
    )


# ==================================================
# CONVERSATION HISTORY
# ==================================================

def format_conversation_history(
    conversation_history: list[dict] | None,
) -> str:
    """
    Convert frontend conversation history into
    readable text for the LLM.
    """

    if not conversation_history:

        return "No previous conversation."

    history_lines = []

    for message in conversation_history:

        role = message.get(
            "role",
            "",
        )

        content = str(
            message.get(
                "content",
                "",
            )
        ).strip()

        if not content:
            continue

        if role == "user":

            history_lines.append(
                f"Student: {content}"
            )

        elif role == "assistant":

            history_lines.append(
                f"EduMind Tutor: {content}"
            )

    if not history_lines:

        return "No previous conversation."

    return "\n".join(
        history_lines
    )


# ==================================================
# NORMALIZE TEXT
# ==================================================

def normalize_text(
    text: str,
) -> str:
    """
    Normalize whitespace.
    """

    return re.sub(
        r"\s+",
        " ",
        str(text).strip(),
    )


# ==================================================
# EXPLICIT STUDENT TOPIC
# ==================================================

def extract_explicit_topic(
    message: str,
) -> str | None:
    """
    Extract an explicitly named learning topic from
    the student's message.
    """

    message = normalize_text(
        message
    )

    if not message:

        return None

    patterns = [
        r"^\s*explain\s+(.+?)\s*$",
        r"^\s*what\s+is\s+(.+?)\s*$",
        r"^\s*what\s+are\s+(.+?)\s*$",
        r"^\s*define\s+(.+?)\s*$",
        r"^\s*tell\s+me\s+about\s+(.+?)\s*$",
        r"^\s*teach\s+me\s+about\s+(.+?)\s*$",
        r"^\s*teach\s+me\s+(.+?)\s*$",
        r"^\s*help\s+me\s+understand\s+(.+?)\s*$",
        r"^\s*i\s+want\s+to\s+learn\s+about\s+(.+?)\s*$",
        r"^\s*let'?s\s+learn\s+about\s+(.+?)\s*$",
    ]

    for pattern in patterns:

        match = re.match(
            pattern,
            message,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        candidate = match.group(
            1
        ).strip()

        candidate = re.split(
            r"\b(?:"
            r"in simple language|"
            r"in simple words|"
            r"in easy language|"
            r"in easy words|"
            r"very simply|"
            r"simply|"
            r"with an example|"
            r"with a real-world example|"
            r"with examples|"
            r"for an mca student|"
            r"for my exam"
            r")\b",
            candidate,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0].strip()

        candidate = candidate.rstrip(
            "?.!"
        ).strip()

        if candidate:

            return candidate

    return None


# ==================================================
# ACTIVE STUDENT TOPIC
# ==================================================

def find_active_student_topic(
    conversation_history: list[dict] | None,
) -> str | None:
    """
    Find the most recent explicit topic from the
    student's own messages.
    """

    if not conversation_history:

        return None

    for message in reversed(
        conversation_history
    ):

        if message.get(
            "role"
        ) != "user":

            continue

        content = str(
            message.get(
                "content",
                "",
            )
        ).strip()

        if not content:

            continue

        topic = extract_explicit_topic(
            content
        )

        if topic:

            return topic

    return None


# ==================================================
# FOLLOW-UP DETECTION
# ==================================================

def detect_follow_up_type(
    question: str,
) -> str:
    """
    Detect common conversational follow-ups.
    """

    normalized = normalize_text(
        question
    ).lower()

    if re.fullmatch(
        r"why\s*\??",
        normalized,
    ):

        return "why"

    if re.fullmatch(
        r"why\s+is\s+(it|this|that)\s+useful\s*\??",
        normalized,
    ):

        return "why"

    if re.fullmatch(
        r"why\s+is\s+(it|this|that)\s+important\s*\??",
        normalized,
    ):

        return "why"

    if re.fullmatch(
        r"why\s+do\s+(we|you)\s+use\s+(it|this|that)\s*\??",
        normalized,
    ):

        return "why"

    if re.fullmatch(
        r"how\s*\??",
        normalized,
    ):

        return "how"

    if re.fullmatch(
        r"how\s+does\s+(it|this|that)\s+work\s*\??",
        normalized,
    ):

        return "how"

    if re.fullmatch(
        r"how\s+is\s+(it|this|that)\s+used\s*\??",
        normalized,
    ):

        return "how"

    if (
        "i don't understand" in normalized
        or "i dont understand" in normalized
        or "i do not understand" in normalized
        or "i'm confused" in normalized
        or "im confused" in normalized
    ):

        return "simple_explanation"

    if re.fullmatch(
        r"(please\s+)?explain\s+(this|that|it)\s*\.?",
        normalized,
    ):

        return "explain_reference"

    if (
        "another example" in normalized
        or "give me another example" in normalized
        or "give another example" in normalized
        or "one more example" in normalized
    ):

        return "another_example"

    if re.search(
        r"\bsecond\s+(one|type|point|item|concept)\b",
        normalized,
    ):

        return "second_item"

    if re.search(
        r"\bfirst\s+(one|type|point|item|concept)\b",
        normalized,
    ):

        return "first_item"

    if (
        "tell me more" in normalized
        or "explain further" in normalized
        or "explain more" in normalized
        or "more details" in normalized
    ):

        return "more_detail"

    return "normal"


# ==================================================
# DETERMINISTIC FOLLOW-UP QUERY
# ==================================================

def build_deterministic_follow_up_query(
    question: str,
    active_topic: str | None,
) -> str | None:
    """
    Build safe retrieval queries for common vague
    conversational follow-ups.
    """

    if not active_topic:

        return None

    follow_up_type = detect_follow_up_type(
        question
    )

    if follow_up_type == "why":

        return (
            f"importance, usefulness, benefits, "
            f"and applications of {active_topic}"
        )

    if follow_up_type == "how":

        return (
            f"how {active_topic} works "
            f"and how it is used"
        )

    if follow_up_type == "simple_explanation":

        return (
            f"{active_topic} explained in very simple "
            f"language with a real-world example"
        )

    if follow_up_type == "explain_reference":

        return (
            f"explanation of {active_topic} "
            f"in simple and clear language"
        )

    if follow_up_type == "another_example":

        return (
            f"examples of {active_topic}, "
            f"including practical or real-world examples"
        )

    if follow_up_type in {
        "first_item",
        "second_item",
    }:

        return (
            f"{active_topic} {question}"
        )

    if follow_up_type == "more_detail":

        return (
            f"detailed explanation of {active_topic}"
        )

    return None


# ==================================================
# REWRITE TUTOR QUERY
# ==================================================

def rewrite_tutor_query(
    question: str,
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Rewrite a student's question for retrieval.
    """

    question = question.strip()

    if not question:

        raise ValueError(
            "Question cannot be empty."
        )

    if not conversation_history:

        return question

    active_topic = find_active_student_topic(
        conversation_history
    )

    print(
        "Detected active student topic:",
        active_topic,
    )

    deterministic_query = (
        build_deterministic_follow_up_query(
            question,
            active_topic,
        )
    )

    if deterministic_query:

        print(
            "Deterministic retrieval query:",
            deterministic_query,
        )

        return deterministic_query

    if not active_topic:

        return question

    active_topic_words = {
        word.lower()
        for word in re.findall(
            r"\b[a-zA-Z0-9]+\b",
            active_topic,
        )
        if len(word) > 2
    }

    question_words = {
        word.lower()
        for word in re.findall(
            r"\b[a-zA-Z0-9]+\b",
            question,
        )
    }

    if (
        active_topic_words
        and active_topic_words.intersection(
            question_words
        )
    ):

        return question

    history = format_conversation_history(
        conversation_history
    )

    prompt = f"""
You are EduMind's search-query rewriting component.

Rewrite the student's CURRENT QUESTION into one
standalone query for searching a study document.

Do NOT answer the student.

ACTIVE STUDENT TOPIC:

{active_topic}

CURRENT QUESTION:

{question}

CONVERSATION:

{history}

RULES:

1. Preserve the active student topic.
2. Resolve vague references.
3. Tutor examples do not change the topic.
4. Do not invent a topic.
5. Preserve the student's intent.
6. Return only the rewritten search query.
"""

    rewritten_query = ask_ai(
        prompt
    ).strip()

    if not rewritten_query:

        return question

    return rewritten_query.strip(
        "\"'"
    ).strip()


# ==================================================
# RETRIEVED CONTEXT
# ==================================================

def format_retrieved_context(
    retrieved_chunks: list[dict],
) -> str:
    """
    Format retrieved chunks for the tutor.
    """

    if not retrieved_chunks:

        return (
            "No relevant document context was retrieved."
        )

    context_parts = []

    for number, result in enumerate(
        retrieved_chunks,
        start=1,
    ):

        text = str(
            result.get(
                "chunk",
                "",
            )
        ).strip()

        if not text:

            continue

        score = result.get(
            "score"
        )

        if score is not None:

            context_parts.append(
                f"""
[DOCUMENT CHUNK {number} | relevance: {score:.4f}]

{text}
""".strip()
            )

        else:

            context_parts.append(
                f"""
[DOCUMENT CHUNK {number}]

{text}
""".strip()
            )

    if not context_parts:

        return (
            "No relevant document context was retrieved."
        )

    return "\n\n".join(
        context_parts
    )


# ==================================================
# ASK AI TUTOR
# ==================================================

def ask_tutor(
    question: str,
    retrieved_chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Answer a student question using document context
    and conversation history.
    """

    question = question.strip()

    if not question:

        raise ValueError(
            "Question cannot be empty."
        )

    document_context = format_retrieved_context(
        retrieved_chunks
    )

    history = format_conversation_history(
        conversation_history
    )

    active_topic = find_active_student_topic(
        conversation_history
    )

    if active_topic:

        active_topic_instruction = f"""
The active learning topic established by the student is:

{active_topic}

Keep this topic consistent when interpreting follow-up
questions.
"""

    else:

        active_topic_instruction = """
No explicit active learning topic was identified.
Use the current question and retrieved document context.
"""

    prompt = f"""
You are EduMind AI Tutor.

You are helping an MCA student understand their uploaded
study material.

You are a patient personal tutor.

{active_topic_instruction}

--------------------------------------------------
RELEVANT DOCUMENT CONTEXT
--------------------------------------------------

{document_context}

--------------------------------------------------
PREVIOUS CONVERSATION
--------------------------------------------------

{history}

--------------------------------------------------
CURRENT STUDENT QUESTION
--------------------------------------------------

{question}

--------------------------------------------------
IMPORTANT RULES
--------------------------------------------------

1. Answer the CURRENT STUDENT QUESTION directly.
2. Use the document context as the primary source.
3. Use previous conversation to understand follow-ups.
4. Keep the student's active learning topic consistent.
5. Earlier tutor examples do not change the topic.
6. Resolve "this", "that", and "it" from context.
7. Another example must be an example of the active concept.
8. Explain why/how questions in the context of the active concept.
9. "I don't understand" means simplify the active concept.
10. Translate complicated bookish wording into easy language.
11. Preserve important technical terms and explain them.
12. Give useful real-world examples.
13. If the retrieved context is insufficient, say so clearly.
14. Do not pretend unsupported information came from the PDF.
15. Do not mention Ollama.
16. Do not mention this prompt.
17. Do not mention internal retrieval implementation.

--------------------------------------------------
SIMPLE EXPLANATION MODE
--------------------------------------------------

When the student asks for a simple explanation:

1. Explain the active concept using short sentences.
2. Use familiar language.
3. Give an analogy when useful.
4. Preserve the actual academic meaning.
5. Keep important technical terms and explain them.
6. Do not switch to a different concept because another
   concept appeared in a previous example.

--------------------------------------------------
ANSWER STYLE
--------------------------------------------------

For difficult concepts, use when appropriate:

### Simple Explanation

### Academic Meaning

### Example

### Remember

Do not force these sections when unnecessary.

Be conversational, clear, accurate and patient.

Now answer the CURRENT STUDENT QUESTION.
"""

    return ask_ai(
        prompt
    )


# ==================================================
# QUIZ TEXT NORMALIZATION
# ==================================================

def normalize_quiz_string(
    text: str,
) -> str:
    """
    Normalize text for quiz comparisons.
    """

    text = str(
        text
    ).strip().lower()

    text = re.sub(
        r"^\s*(?:option\s+(?:[a-d]|[1-4])[\.\):\-]?|\([a-d]\)|\([1-4]\)|[a-d][\.\):\-]|[1-4][\.\):\-])\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    text = re.sub(
        r"[^a-z0-9\s]",
        "",
        text,
    )

    return text.strip()


# ==================================================
# CLEAN OPTION
# ==================================================

def clean_option_text(
    option: str,
) -> str:
    """
    Remove accidental option labels.
    """

    option = str(
        option
    ).strip()

    option = re.sub(
        r"^\s*(?:option\s+(?:[a-d]|[1-4])[\.\):\-]?|\([a-d]\)|\([1-4]\)|[a-d][\.\):\-]|[1-4][\.\):\-])\s*",
        "",
        option,
        flags=re.IGNORECASE,
    )

    return option.strip()


# ==================================================
# SIMILARITY
# ==================================================

def are_similar_texts(
    first: str,
    second: str,
    threshold: float = 0.92,
) -> bool:
    """
    Compare two quiz strings without over-rejecting short conceptual labels.

    Exact normalized matches are always considered duplicates. For longer
    strings, SequenceMatcher is useful for catching genuine near-duplicates.
    Very short phrases are only rejected when they are exactly the same or
    extremely close, because short technical terms naturally share words.
    """

    first_normalized = normalize_quiz_string(first)
    second_normalized = normalize_quiz_string(second)

    if not first_normalized or not second_normalized:
        return False

    if first_normalized == second_normalized:
        return True

    first_words = first_normalized.split()
    second_words = second_normalized.split()

    # Do not use an aggressive character-ratio check for very short phrases.
    # For example, "Logical OR operation" and "Logical AND operation" are
    # distinct answer choices even though they share most of their wording.
    if min(len(first_normalized), len(second_normalized)) < 24:
        return (
            SequenceMatcher(
                None,
                first_normalized,
                second_normalized,
            ).ratio() >= 0.97
        )

    return (
        SequenceMatcher(
            None,
            first_normalized,
            second_normalized,
        ).ratio() >= threshold
    )



# ==================================================
# DUPLICATE QUESTION
# ==================================================

def are_duplicate_questions(
    first: str,
    second: str,
) -> bool:
    """
    Detect genuine duplicate or near-duplicate quiz questions.

    Exact normalized equality is always a duplicate. For paraphrases, use a
    conservative similarity threshold so that questions about the same broad
    subject are not incorrectly rejected merely because they share common
    academic vocabulary.
    """

    first_normalized = normalize_quiz_string(first)
    second_normalized = normalize_quiz_string(second)

    if not first_normalized or not second_normalized:
        return False

    if first_normalized == second_normalized:
        return True

    # Only use fuzzy matching when the questions are reasonably long. Short
    # questions can have high character similarity while testing different
    # concepts.
    if min(len(first_normalized), len(second_normalized)) < 36:
        return False

    return (
        SequenceMatcher(
            None,
            first_normalized,
            second_normalized,
        ).ratio() >= 0.93
    )



# ==================================================
# MATCH CORRECT ANSWER
# ==================================================

def match_correct_answer(
    correct_answer: str,
    options: list[str],
) -> str | None:
    """
    Resolve the model's correct-answer value.

    Supports:

    - A/B/C/D
    - 1/2/3/4
    - Option 1/2/3/4
    - exact option text
    """

    answer = str(
        correct_answer
    ).strip()

    if not answer:

        return None

    # --------------------------------------------------
    # A / B / C / D
    # IMPORTANT: check the RAW answer first.
    # clean_option_text() must not turn bare "A" into "".
    # --------------------------------------------------

    letter_match = re.fullmatch(
        r"\(?([a-d])\)?(?:[\.\):\-])?",
        answer,
        flags=re.IGNORECASE,
    )

    if letter_match:

        index = (
            ord(
                letter_match.group(1).upper()
            )
            - ord("A")
        )

        if 0 <= index < len(options):

            return options[index]

    # --------------------------------------------------
    # Option A / Option B / ...
    # Option 1 / Option 2 / ...
    # --------------------------------------------------

    option_letter_match = re.fullmatch(
        r"option\s*\(?([a-d])\)?(?:[\.\):\-])?",
        answer,
        flags=re.IGNORECASE,
    )

    if option_letter_match:

        index = (
            ord(option_letter_match.group(1).upper())
            - ord("A")
        )

        if 0 <= index < len(options):
            return options[index]

    option_match = re.fullmatch(
        r"option\s*([1-4])(?:[\.\):\-])?",
        answer,
        flags=re.IGNORECASE,
    )

    if option_match:

        index = int(
            option_match.group(1)
        ) - 1

        if 0 <= index < len(options):

            return options[index]

    # --------------------------------------------------
    # 1 / 2 / 3 / 4
    # --------------------------------------------------

    number_match = re.fullmatch(
        r"[1-4](?:[\.\):\-])?",
        answer,
    )

    if number_match:

        index = (
            int(
                number_match.group()
            )
            - 1
        )

        if 0 <= index < len(options):

            return options[index]

    # --------------------------------------------------
    # Exact normalized text
    # --------------------------------------------------

    cleaned_answer = clean_option_text(
        answer
    )

    normalized_answer = normalize_quiz_string(
        cleaned_answer
    )

    for option in options:

        if (
            normalize_quiz_string(
                option
            )
            == normalized_answer
        ):

            return option

    # --------------------------------------------------
    # Small containment tolerance
    # --------------------------------------------------

    matches = []

    for option in options:

        normalized_option = normalize_quiz_string(
            option
        )

        if not normalized_option:

            continue

        if (
            normalized_answer in normalized_option
            or normalized_option in normalized_answer
        ):

            matches.append(
                option
            )

    if len(matches) == 1:

        return matches[0]

    return None


# ==================================================
# TRUTH TABLE PROTECTION
# ==================================================

def looks_like_truth_table_row(
    text: str,
) -> bool:
    """
    Detect text resembling one truth-table row.
    """

    normalized = str(
        text
    ).strip().lower()

    truth_tokens = len(
        re.findall(
            r"\b(?:true|false|t|f)\b",
            normalized,
        )
    )

    variable_tokens = len(
        re.findall(
            r"\b[pqrs]\b",
            normalized,
        )
    )

    dictionary_pattern = (
        "{" in normalized
        and ":" in normalized
    )

    return (
        truth_tokens >= 2
        and (
            variable_tokens >= 2
            or dictionary_pattern
        )
    )


def is_malformed_truth_table_question(
    question: str,
    options: list[str],
) -> bool:
    """
    Reject malformed truth-table questions.
    """

    normalized_question = normalize_quiz_string(
        question
    )

    asks_for_truth_table = any(
        keyword in normalized_question
        for keyword in [
            "truth table",
            "truth tables",
            "complete truth table",
            "truth value table",
        ]
    )

    if not asks_for_truth_table:

        return False

    row_like_options = sum(
        looks_like_truth_table_row(
            option
        )
        for option in options
    )

    return row_like_options >= 2


# ==================================================
# OPTION QUALITY
# ==================================================

def validate_option_quality(
    options: list[str],
) -> None:
    """
    Validate answer options without falsely rejecting short technical terms.
    """

    normalized_options = [
        normalize_quiz_string(option)
        for option in options
    ]

    if len(set(normalized_options)) != len(options):
        raise RuntimeError(
            "Quiz question contains duplicate answer options."
        )

    for option in options:
        if len(normalize_quiz_string(option)) < 2:
            raise RuntimeError(
                "Quiz question contains an invalid answer option."
            )

    for index in range(len(options)):
        for other_index in range(index + 1, len(options)):
            first = normalized_options[index]
            second = normalized_options[other_index]

            if not first or not second:
                continue

            # Exact duplicates were already handled above. Short conceptual
            # answers such as "Implication", "Disjunction", "Conjunction",
            # and "Negation" should not be rejected merely because they share
            # a few characters.
            if min(len(first), len(second)) < 24:
                continue

            if are_similar_texts(
                options[index],
                options[other_index],
                threshold=0.95,
            ):
                raise RuntimeError(
                    "Quiz question contains nearly identical options."
                )



# ==================================================
# EXTRACT ONE QUESTION
# ==================================================

def extract_single_quiz_question(
    raw_response: str,
) -> dict:
    """
    Parse the quiz response.

    Since quiz generation uses Ollama JSON mode,
    we expect a JSON object.

    A balanced-bracket fallback is retained in case
    Ollama still returns surrounding text.
    """

    text = str(
        raw_response
    ).strip()

    if not text:

        raise RuntimeError(
            "AI quiz response was empty."
        )

    # --------------------------------------------------
    # Direct JSON
    # --------------------------------------------------

    try:

        parsed = json.loads(
            text
        )

    except json.JSONDecodeError:

        parsed = None

    if isinstance(
        parsed,
        dict,
    ):

        if "question" in parsed:

            return parsed

        questions = parsed.get(
            "questions"
        )

        if (
            isinstance(
                questions,
                list,
            )
            and questions
            and isinstance(
                questions[0],
                dict,
            )
        ):

            return questions[0]

    if (
        isinstance(
            parsed,
            list,
        )
        and parsed
        and isinstance(
            parsed[0],
            dict,
        )
    ):

        return parsed[0]

    # --------------------------------------------------
    # Fallback balanced JSON object scan
    # --------------------------------------------------

    clean_text = re.sub(
        r"```(?:json)?",
        "",
        text,
        flags=re.IGNORECASE,
    ).replace(
        "```",
        "",
    ).strip()

    object_start = None
    depth = 0
    in_string = False
    escaped = False

    for index, character in enumerate(
        clean_text
    ):

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

                candidate = clean_text[
                    object_start:index + 1
                ]

                try:

                    parsed = json.loads(
                        candidate
                    )

                except json.JSONDecodeError:

                    parsed = None

                if isinstance(
                    parsed,
                    dict,
                ):

                    if "question" in parsed:

                        return parsed

                    questions = parsed.get(
                        "questions"
                    )

                    if (
                        isinstance(
                            questions,
                            list,
                        )
                        and questions
                        and isinstance(
                            questions[0],
                            dict,
                        )
                    ):

                        return questions[0]

                object_start = None

    raise RuntimeError(
        "AI quiz response did not contain a valid question object."
    )


# ==================================================
# VALIDATE ONE QUIZ QUESTION
# ==================================================

def validate_single_quiz_question(
    item,
) -> dict:
    """
    Validate the structural shape of a generated quiz candidate.

    The generator's answer is deliberately not trusted. Correctness is
    determined independently after structural validation.
    """

    if not isinstance(item, dict):
        raise RuntimeError(
            "AI quiz response is not a valid question object."
        )

    question = str(
        item.get("question", "")
    ).strip()

    options = item.get("options")

    if not question:
        raise RuntimeError(
            "Quiz question has no question text."
        )

    if not isinstance(options, list):
        raise RuntimeError(
            "Quiz question options must be a list."
        )

    cleaned_options = [
        clean_option_text(str(option))
        for option in options
        if str(option).strip()
    ]

    if len(cleaned_options) != 4:
        raise RuntimeError(
            "Quiz question must have exactly 4 options."
        )

    validate_option_quality(cleaned_options)

    if is_malformed_truth_table_question(
        question,
        cleaned_options,
    ):
        raise RuntimeError(
            "Quiz question is a malformed truth-table question."
        )

    return {
        "question": question,
        "options": cleaned_options,
        "correct_answer": "",
        "explanation": "",
    }



# ==================================================
# BUILD QUIZ PROMPT
# ==================================================

def build_single_quiz_prompt(
    document_context: str,
    difficulty: str,
    question_number: int,
    previous_questions: list[str],
    rejected_questions: list[str] | None = None,
    retry: bool = False,
) -> str:
    """
    Build a prompt that asks the small local model to generate only a clean
    MCQ candidate. Answer selection and explanation generation happen later.
    """

    previous_questions_text = (
        "\n".join(
            f"{index}. {question}"
            for index, question in enumerate(
                previous_questions,
                start=1,
            )
        )
        if previous_questions
        else "None."
    )

    rejected_questions_text = (
        "\n".join(
            f"{index}. {question}"
            for index, question in enumerate(
                rejected_questions[-8:],
                start=1,
            )
        )
        if rejected_questions
        else "None."
    )

    retry_instruction = (
        """
This is a retry.
Generate a different question from a different fact or concept.
"""
        if retry
        else ""
    )

    return f"""
You are EduMind, an MCA quiz generator.

Create ONE clean multiple-choice question from ONLY the STUDY MATERIAL.

Question number: {question_number}
Difficulty: {difficulty}

{retry_instruction}

ALREADY ACCEPTED QUESTIONS:
{previous_questions_text}

REJECTED QUESTIONS:
{rejected_questions_text}

Do not repeat, paraphrase, or imitate any accepted or rejected question.

QUESTION QUALITY:
- Test exactly ONE fact, definition, relationship, example, or application.
- The question must be directly answerable from the study material.
- Create exactly 4 options.
- Every option must answer the same question.
- Exactly one option should be the best answer.
- Wrong options must be clearly wrong for THIS question.
- Do not use "Both", "Neither", "All of the above", or "None of the above".
- Do not create two options that could both reasonably be correct.
- Do not mix definitions of different concepts.
- Do not invent facts.
- Keep options short and comparable.
- Do not include the answer text inside the question.
- Do not use Markdown.

IMPORTANT:
Do NOT generate a correct_answer field.
Do NOT generate an explanation field.
The answer will be independently determined later.

STUDY MATERIAL:
{document_context}

RETURN ONLY THIS JSON:

{{
  "question": "Question text",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ]
}}
"""



# ==================================================
# QUIZ CORRECTNESS VERIFICATION
# ==================================================

def _extract_json_object_from_text(
    raw_response: str,
) -> dict | None:
    """
    Extract the first valid JSON object from an AI response.

    Handles:
    - raw JSON
    - JSON wrapped in Markdown fences
    - JSON surrounded by explanatory text
    """

    text = str(raw_response).strip()

    if not text:
        return None

    try:
        parsed = json.loads(text)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    clean_text = re.sub(
        r"```(?:json)?",
        "",
        text,
        flags=re.IGNORECASE,
    ).replace(
        "```",
        "",
    ).strip()

    object_start = None
    depth = 0
    in_string = False
    escaped = False

    for index, character in enumerate(clean_text):

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

                candidate = clean_text[
                    object_start:index + 1
                ]

                try:
                    parsed = json.loads(candidate)

                except json.JSONDecodeError:
                    parsed = None

                if isinstance(parsed, dict):
                    return parsed

                object_start = None

    return None


def normalize_answer_letter(
    value: str,
) -> str | None:
    """
    Normalize an answer reference to A/B/C/D.

    Accepts:
    - A / B / C / D
    - (A) / (B) / ...
    - A. / B. / ...
    - Option A / Option B / ...
    - 1 / 2 / 3 / 4
    - Option 1 / Option 2 / ...
    """

    answer = str(value).strip()

    if not answer:
        return None

    letter_match = re.fullmatch(
        r"(?:option\s*)?\(?([a-d])\)?(?:[\.\):\-])?",
        answer,
        flags=re.IGNORECASE,
    )

    if letter_match:
        return letter_match.group(1).upper()

    number_match = re.fullmatch(
        r"(?:option\s*)?([1-4])(?:[\.\):\-])?",
        answer,
        flags=re.IGNORECASE,
    )

    if number_match:
        return chr(
            ord("A") + int(number_match.group(1)) - 1
        )

    return None


def _coerce_boolean(value) -> bool | None:
    """
    Convert common AI boolean representations to bool.
    Returns None when the value is not recognizable.
    """

    if isinstance(value, bool):
        return value

    if isinstance(value, str):

        normalized = value.strip().lower()

        if normalized in {"true", "yes", "1"}:
            return True

        if normalized in {"false", "no", "0"}:
            return False

    return None


def verify_quiz_question(
    question: str,
    options: list[str],
    generated_correct_answer: str,
    explanation: str,
    document_context: str,
) -> tuple[str, bool]:
    """
    Independently determine whether a generated MCQ is well-formed and select
    the best-supported correct option.

    The generator's proposed answer and explanation are intentionally ignored.
    """

    if len(options) != 4:
        raise RuntimeError(
            "Quiz correctness verification requires exactly 4 options."
        )

    labeled_options = "\n".join(
        f"{chr(ord('A') + index)}. {option}"
        for index, option in enumerate(options)
    )

    verifier_prompt = f"""
You are EduMind's final MCQ checker.

Use ONLY the STUDY MATERIAL.

First decide whether the QUESTION has one clear best answer among A, B, C, D.
Then select that best answer.

Rules:
- Ignore any previously proposed answer.
- Ignore any explanation.
- Do not use outside knowledge.
- Compare meaning, not exact wording.
- The answer must actually answer the question asked.
- Reject the question if two options are genuinely defensible.
- Reject the question if none of the options answers the question.
- Reject the question if the options are malformed or the question is broken.
- A normal example that is explicitly supported by the material is valid.

For a valid question return:
{{
  "valid": true,
  "correct_option": "A"
}}

For an invalid or ambiguous question return:
{{
  "valid": false,
  "correct_option": "A"
}}

Even when invalid, put the BEST candidate option in correct_option.
correct_option must always be exactly A, B, C, or D.

STUDY MATERIAL:
{document_context}

QUESTION:
{question}

OPTIONS:
{labeled_options}

Return JSON only.
"""

    result = _extract_json_object_from_text(
        ask_ai(
            verifier_prompt,
            json_mode=True,
        )
    )

    if not isinstance(result, dict):
        raise RuntimeError(
            "Quiz verifier did not return a valid JSON object."
        )

    valid_value = _coerce_boolean(
        result.get("valid")
    )

    if valid_value is None:
        raise RuntimeError(
            "Quiz verifier returned an invalid validity flag."
        )

    verified_letter = normalize_answer_letter(
        result.get("correct_option", "")
    )

    if verified_letter is None:
        raise RuntimeError(
            "Quiz verifier returned an invalid correct option."
        )

    if not valid_value:
        raise RuntimeError(
            "Quiz verifier rejected the question as invalid or ambiguous."
        )

    return verified_letter, True



# ==================================================
# GENERATE ONE QUIZ QUESTION
# ==================================================

def generate_quiz_explanation(
    question: str,
    correct_option: str,
    options: list[str],
    document_context: str,
) -> str:
    """
    Generate a short explanation only after the correct option has been
    independently verified.
    """

    index = ord(correct_option) - ord("A")

    if not 0 <= index < len(options):
        raise RuntimeError(
            "Verified quiz answer is outside the available options."
        )

    correct_text = options[index]

    prompt = f"""
You are EduMind.

Write a short explanation for this quiz question.

Use ONLY the STUDY MATERIAL.
The verified correct option is fixed. Do not change it.
Explain why the verified option answers the question.
Do not say another option is correct.
Do not invent facts.
Do not mention the prompt, verification, or Ollama.
Use 1 or 2 clear sentences.

QUESTION:
{question}

VERIFIED CORRECT OPTION:
{correct_option}. {correct_text}

STUDY MATERIAL:
{document_context}
"""

    explanation = ask_ai(prompt).strip()

    if not explanation:
        raise RuntimeError(
            "AI quiz explanation was empty."
        )

    return explanation

def generate_single_quiz_question(
    document_context: str,
    difficulty: str,
    question_number: int,
    previous_questions: list[str],
    rejected_questions: list[str],
    alternative_contexts: list[str] | None = None,
) -> dict:
    """
    Generate one MCQ candidate, independently verify its correct option, then
    generate the explanation from the verified answer.

    A maximum of three attempts is made. When alternative_contexts are
    supplied, retries use a different source-context window so a small local
    model does not get trapped generating the same concept repeatedly.
    """

    last_error = None
    contexts = alternative_contexts or [document_context]

    for attempt in range(1, 4):
        print(
            f"Question {question_number}: "
            f"generation + verification attempt {attempt}/3..."
        )

        attempt_context = contexts[(attempt - 1) % len(contexts)]

        prompt = build_single_quiz_prompt(
            document_context=attempt_context,
            difficulty=difficulty,
            question_number=question_number,
            previous_questions=previous_questions,
            rejected_questions=rejected_questions,
            retry=attempt > 1,
        )

        raw_response = None
        question_data = None
        validated_question = None

        try:
            raw_response = ask_ai(
                prompt,
                json_mode=True,
            )

            question_data = extract_single_quiz_question(
                raw_response
            )

            validated_question = validate_single_quiz_question(
                question_data
            )

            candidate_question = validated_question["question"]

            for previous_question in previous_questions:
                if are_duplicate_questions(
                    candidate_question,
                    previous_question,
                ):
                    raise RuntimeError(
                        "Generated question is a duplicate or near-duplicate "
                        "of an earlier question."
                    )

            for rejected_question in rejected_questions:
                if are_duplicate_questions(
                    candidate_question,
                    rejected_question,
                ):
                    raise RuntimeError(
                        "Generated question repeats a previously rejected "
                        "question."
                    )

            verified_answer_letter, _ = verify_quiz_question(
                question=candidate_question,
                options=validated_question["options"],
                generated_correct_answer="",
                explanation="",
                document_context=attempt_context,
            )

            verified_answer_index = ord(verified_answer_letter) - ord("A")
            verified_answer_text = validated_question["options"][verified_answer_index]

            print(
                f"Question {question_number}: "
                f"verified correct option = {verified_answer_letter}"
            )

            explanation = generate_quiz_explanation(
                question=candidate_question,
                correct_option=verified_answer_letter,
                options=validated_question["options"],
                document_context=attempt_context,
            )

            validated_question["correct_answer"] = verified_answer_text
            validated_question["explanation"] = explanation

            normalized_explanation = normalize_quiz_string(explanation)
            normalized_answer_text = normalize_quiz_string(verified_answer_text)

            if (
                normalized_answer_text
                and normalized_answer_text not in normalized_explanation
                and verified_answer_letter.lower() not in normalized_explanation
            ):
                validated_question["explanation"] = generate_quiz_explanation(
                    question=candidate_question,
                    correct_option=verified_answer_letter,
                    options=validated_question["options"],
                    document_context=attempt_context,
                )

            print(
                f"Question {question_number}: "
                "question, answer, and explanation verification passed."
            )

            print(
                f"Question {question_number}: "
                f"generation succeeded on attempt {attempt}."
            )

            return validated_question

        except Exception as error:
            last_error = error

            rejected_candidate = None

            if isinstance(question_data, dict):
                rejected_candidate = str(
                    question_data.get("question", "")
                ).strip()

            if not rejected_candidate and isinstance(validated_question, dict):
                rejected_candidate = str(
                    validated_question.get("question", "")
                ).strip()

            if rejected_candidate and not any(
                are_duplicate_questions(rejected_candidate, existing)
                for existing in rejected_questions
            ):
                rejected_questions.append(rejected_candidate)

            print(
                f"Question {question_number}: "
                f"attempt {attempt} failed:",
                error,
            )

            if raw_response is not None:
                print(
                    "\n"
                    "================ RAW OLLAMA QUIZ RESPONSE "
                    "================"
                )
                print(raw_response)
                print(
                    "================ END RAW OLLAMA RESPONSE "
                    "================\n"
                )

    raise RuntimeError(
        f"Could not generate valid question "
        f"{question_number} after 3 attempts: "
        f"{last_error}"
    )




# ==================================================
# QUIZ CONTEXT DIVERSITY HELPERS
# ==================================================

QUIZ_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "than",
    "that", "this", "these", "those", "is", "are", "was", "were",
    "be", "been", "being", "of", "to", "in", "on", "for", "from",
    "with", "by", "as", "at", "into", "through", "about", "over",
    "under", "between", "what", "which", "who", "where", "when",
    "why", "how", "type", "kind", "term", "meaning", "main", "primary",
    "following", "used", "use", "using", "deal", "deals", "dealing",
    "values", "value", "structure", "structures", "question", "according",
    "document", "study", "material", "example", "examples", "such", "can",
    "may", "does", "do", "their", "they", "them", "its", "it", "one",
    "two", "four", "each", "all", "only", "also", "called", "defined",
    "definition", "describe", "describes", "best", "correct", "answer",
}


def quiz_content_keywords(text: str) -> set[str]:
    """
    Extract meaningful words for deterministic topic/context diversity.

    This is deliberately lightweight and does not attempt semantic embedding.
    It exists only to keep a small local model from repeatedly seeing contexts
    dominated by concepts already used in accepted questions.
    """
    words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9]{2,}\b", str(text).lower())
    return {
        word
        for word in words
        if word not in QUIZ_STOPWORDS
    }


def quiz_question_context_overlap(
    context: str,
    questions: list[str],
) -> int:
    """
    Count meaningful keyword overlap between a context and accepted questions.
    Lower scores mean the context is more likely to contain a fresh concept.
    """
    context_words = quiz_content_keywords(context)

    if not context_words or not questions:
        return 0

    used_words = set()
    for question in questions:
        used_words.update(
            quiz_content_keywords(question)
        )

    return len(context_words.intersection(used_words))


def choose_diverse_quiz_contexts(
    context_windows: list[str],
    accepted_questions: list[str],
    primary_index: int,
    count: int = 3,
) -> list[str]:
    """
    Rank candidate context windows by how little their content overlaps with
    already accepted question topics, while keeping the requested primary
    window first.
    """
    if not context_windows:
        return []

    primary = context_windows[primary_index % len(context_windows)]

    scored = []
    for index, context in enumerate(context_windows):
        overlap = quiz_question_context_overlap(
            context,
            accepted_questions,
        )
        distance = abs(index - primary_index)
        scored.append((
            overlap,
            0 if index == primary_index else 1,
            distance,
            index,
            context,
        ))

    scored.sort(key=lambda item: item[:4])

    ordered = [primary]
    for _, _, _, _, context in scored:
        if context == primary:
            continue
        if context in ordered:
            continue
        ordered.append(context)
        if len(ordered) >= max(1, count):
            break

    return ordered


# ==================================================
# GENERATE QUIZ
# ==================================================

def generate_quiz(
    retrieved_chunks: list[dict],
    num_questions: int = 5,
    difficulty: str = "medium",
) -> list[dict]:
    """
    Generate a document-grounded quiz with deterministic context diversity.

    The model still receives focused source windows, but each new question is
    assigned a window whose content has the least overlap with already accepted
    question topics. This prevents a small local model from repeatedly choosing
    the most salient concept in the document.
    """

    if not retrieved_chunks:
        raise ValueError(
            "No document context is available for quiz generation."
        )

    if not 1 <= num_questions <= 20:
        raise ValueError(
            "Number of quiz questions must be between 1 and 20."
        )

    difficulty = difficulty.strip().lower()
    if difficulty not in {"easy", "medium", "hard"}:
        raise ValueError(
            "Difficulty must be easy, medium, or hard."
        )

    generated_questions = []
    previous_questions = []
    rejected_questions = []

    total_chunks = len(retrieved_chunks)
    window_size = 2 if total_chunks > 1 else 1

    starts = list(range(0, total_chunks, window_size))
    starts += [
        start
        for start in range(1, total_chunks, window_size)
        if start not in starts
    ]

    context_windows = []
    for start in starts:
        selected = [
            retrieved_chunks[(start + offset) % total_chunks]
            for offset in range(window_size)
        ]
        context_windows.append(
            format_retrieved_context(selected)
        )

    for question_number in range(1, num_questions + 1):
        print(
            "\n"
            f"Preparing question {question_number}/{num_questions}..."
        )

        # Prefer the least-overlapping context with the concepts already tested.
        ranked_contexts = []
        for index, context in enumerate(context_windows):
            overlap = quiz_question_context_overlap(
                context,
                previous_questions,
            )
            # Stable rotation gives later questions access to windows that have
            # not already been the primary window for earlier questions.
            rotation_distance = (
                index - (question_number - 1)
            ) % len(context_windows)
            ranked_contexts.append((
                overlap,
                rotation_distance,
                index,
                context,
            ))

        ranked_contexts.sort(
            key=lambda item: item[:3]
        )

        primary_index = ranked_contexts[0][2]
        document_context = ranked_contexts[0][3]

        alternative_contexts = choose_diverse_quiz_contexts(
            context_windows=context_windows,
            accepted_questions=previous_questions,
            primary_index=primary_index,
            count=min(3, len(context_windows)),
        )

        print(
            f"Question {question_number}: "
            f"selected context window {primary_index} "
            f"using lowest topic overlap"
        )

        question = generate_single_quiz_question(
            document_context=document_context,
            difficulty=difficulty,
            question_number=question_number,
            previous_questions=previous_questions,
            rejected_questions=rejected_questions,
            alternative_contexts=alternative_contexts,
        )

        generated_questions.append(question)
        previous_questions.append(question["question"])

    print(
        "\n"
        f"Quiz generation completed successfully: "
        f"{len(generated_questions)} questions."
    )

    return generated_questions

# ==================================================
# FLASHCARD TEXT NORMALIZATION
# ==================================================

def normalize_flashcard_text(
    text: str,
) -> str:
    """
    Normalize flashcard text for comparisons.
    """

    text = str(
        text
    ).strip().lower()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    text = re.sub(
        r"[^a-z0-9\s]",
        "",
        text,
    )

    return text.strip()


# ==================================================
# FLASHCARD DUPLICATE DETECTION
# ==================================================

def are_duplicate_flashcards(
    first: str,
    second: str,
) -> bool:
    """
    Detect exact or near-duplicate flashcard fronts.
    """

    first_normalized = normalize_flashcard_text(
        first
    )

    second_normalized = normalize_flashcard_text(
        second
    )

    if not first_normalized or not second_normalized:

        return False

    if first_normalized == second_normalized:

        return True

    similarity = SequenceMatcher(
        None,
        first_normalized,
        second_normalized,
    ).ratio()

    return similarity >= 0.85


# ==================================================
# FLASHCARD TRUTH-TABLE DETECTION
# ==================================================

def looks_like_truth_table_flashcard_back(
    text: str,
) -> bool:
    """
    Detect flattened truth-table answers.

    A flashcard should not return a raw sequence such as:

        A B A→B T T T T F F F T F T T F

    Instead, it should explain the concept in readable
    revision language.
    """

    normalized = normalize_text(
        text
    ).lower()

    if not normalized:

        return False

    truth_tokens = len(
        re.findall(
            r"\b(?:true|false|t|f)\b",
            normalized,
        )
    )

    variable_tokens = len(
        re.findall(
            r"\b[a-z]\b",
            normalized,
        )
    )

    compact_boolean_sequence = bool(
        re.search(
            r"(?:\b[abcdpqrs]\b[\s,:;]*){2,}",
            normalized,
        )
    )

    arrow_present = (
        "→" in normalized
        or "->" in normalized
        or "⇒" in normalized
    )

    # Strong indication of a flattened table:
    # multiple truth tokens plus variables/arrow.
    if (
        truth_tokens >= 4
        and (
            variable_tokens >= 2
            or arrow_present
        )
    ):

        return True

    # Detect very compact table-like sequences.
    words = normalized.split()

    if (
        len(words) >= 8
        and truth_tokens >= 4
        and compact_boolean_sequence
    ):

        return True

    return False


# ==================================================
# FLASHCARD FRONT QUALITY
# ==================================================

def looks_like_clear_flashcard_front(
    front: str,
) -> bool:
    """
    Perform a lightweight quality check on the
    flashcard question/front.

    The front does not need to literally end with '?',
    but it should clearly ask for or identify one
    concept.
    """

    normalized = normalize_text(
        front
    ).lower()

    if not normalized:

        return False

    if len(normalized) < 8:

        return False

    question_indicators = [
        "what",
        "who",
        "when",
        "where",
        "why",
        "how",
        "which",
        "define",
        "explain",
        "describe",
        "name",
        "identify",
        "meaning",
        "purpose",
    ]

    starts_with_indicator = any(
        normalized.startswith(
            indicator + " "
        )
        for indicator in question_indicators
    )

    contains_question_mark = (
        "?" in normalized
    )

    contains_definition_pattern = (
        normalized.startswith(
            "definition of "
        )
        or normalized.startswith(
            "meaning of "
        )
        or normalized.startswith(
            "explain "
        )
    )

    return (
        starts_with_indicator
        or contains_question_mark
        or contains_definition_pattern
    )


# ==================================================
# FLASHCARD BACK QUALITY
# ==================================================

def validate_flashcard_back_quality(
    back: str,
) -> None:
    """
    Validate the flashcard answer/back.

    The answer should be useful for revision:
    concise, readable and not a raw table dump.
    """

    normalized = normalize_text(
        back
    )

    if not normalized:

        raise RuntimeError(
            "Flashcard back is empty."
        )

    normalized_without_punctuation = (
        normalize_flashcard_text(
            normalized
        )
    )

    if len(
        normalized_without_punctuation
    ) < 8:

        raise RuntimeError(
            "Flashcard back is too short."
        )

    if len(normalized) > 900:

        raise RuntimeError(
            "Flashcard back is too long for a revision card."
        )

    if looks_like_truth_table_flashcard_back(
        normalized
    ):

        raise RuntimeError(
            "Flashcard back contains a raw or "
            "flattened truth table."
        )


# ==================================================
# EXTRACT ONE FLASHCARD
# ==================================================

def extract_single_flashcard(
    raw_response: str,
) -> dict:
    """
    Parse one flashcard object from the AI response.
    """

    text = str(
        raw_response
    ).strip()

    if not text:

        raise RuntimeError(
            "AI flashcard response was empty."
        )

    # --------------------------------------------------
    # Direct JSON
    # --------------------------------------------------

    try:

        parsed = json.loads(
            text
        )

    except json.JSONDecodeError:

        parsed = None

    if isinstance(
        parsed,
        dict,
    ):

        if (
            "front" in parsed
            and "back" in parsed
        ):

            return parsed

        flashcards = parsed.get(
            "flashcards"
        )

        if (
            isinstance(
                flashcards,
                list,
            )
            and flashcards
            and isinstance(
                flashcards[0],
                dict,
            )
        ):

            return flashcards[0]

    if (
        isinstance(
            parsed,
            list,
        )
        and parsed
        and isinstance(
            parsed[0],
            dict,
        )
    ):

        return parsed[0]

    # --------------------------------------------------
    # Balanced JSON object scan
    # --------------------------------------------------

    clean_text = re.sub(
        r"```(?:json)?",
        "",
        text,
        flags=re.IGNORECASE,
    ).replace(
        "```",
        "",
    ).strip()

    object_start = None
    depth = 0
    in_string = False
    escaped = False

    for index, character in enumerate(
        clean_text
    ):

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

                candidate = clean_text[
                    object_start:index + 1
                ]

                try:

                    parsed = json.loads(
                        candidate
                    )

                except json.JSONDecodeError:

                    parsed = None

                if isinstance(
                    parsed,
                    dict,
                ):

                    if (
                        "front" in parsed
                        and "back" in parsed
                    ):

                        return parsed

                    flashcards = parsed.get(
                        "flashcards"
                    )

                    if (
                        isinstance(
                            flashcards,
                            list,
                        )
                        and flashcards
                        and isinstance(
                            flashcards[0],
                            dict,
                        )
                    ):

                        return flashcards[0]

                object_start = None

    raise RuntimeError(
        "AI flashcard response did not contain "
        "a valid flashcard object."
    )


# ==================================================
# VALIDATE ONE FLASHCARD
# ==================================================

def validate_single_flashcard(
    item,
) -> dict:
    """
    Validate and normalize one flashcard.
    """

    if not isinstance(
        item,
        dict,
    ):

        raise RuntimeError(
            "AI flashcard response is not a valid object."
        )

    front = str(
        item.get(
            "front",
            "",
        )
    ).strip()

    back = str(
        item.get(
            "back",
            "",
        )
    ).strip()

    if not front:

        raise RuntimeError(
            "Flashcard front is empty."
        )

    if not back:

        raise RuntimeError(
            "Flashcard back is empty."
        )

    if not looks_like_clear_flashcard_front(
        front
    ):

        raise RuntimeError(
            "Flashcard front is not a clear study question."
        )

    validate_flashcard_back_quality(
        back
    )

    return {
        "front": front,
        "back": back,
    }


# ==================================================
# BUILD SINGLE FLASHCARD PROMPT
# ==================================================

def build_single_flashcard_prompt(
    document_context: str,
    difficulty: str,
    card_number: int,
    previous_fronts: list[str],
    retry: bool = False,
) -> str:
    """
    Build a prompt for generating one flashcard.
    """

    if previous_fronts:

        previous_text = "\n".join(
            f"{index}. {front}"
            for index, front in enumerate(
                previous_fronts,
                start=1,
            )
        )

    else:

        previous_text = (
            "No flashcards have been generated yet."
        )

    retry_instruction = ""

    if retry:

        retry_instruction = """
IMPORTANT RETRY:

The previous flashcard failed quality validation.

Generate a completely different flashcard.

Pay particular attention to:

- clear question/front
- concise answer/back
- accurate document-grounded content
- readable formatting
- no raw truth-table rows
- no duplicate concept
"""

    return f"""
You are EduMind, an AI study assistant for MCA students.

Generate EXACTLY ONE high-quality flashcard using ONLY
the supplied study material.

Flashcard number:
{card_number}

Difficulty:
{difficulty}

{retry_instruction}

--------------------------------------------------
PREVIOUS FLASHCARD FRONTS
--------------------------------------------------

{previous_text}

Do NOT repeat or merely reword any previous front.

Choose another meaningful concept, definition,
relationship, principle, example, or application
from the supplied study material whenever possible.

--------------------------------------------------
DOCUMENT CONTEXT
--------------------------------------------------

{document_context}

--------------------------------------------------
FLASHCARD QUALITY RULES
--------------------------------------------------

1. Use ONLY information supported by the document.
2. Do not invent facts.
3. The front must ask ONE clear study question
   or clearly ask for ONE concept/definition.
4. The front should be understandable without
   additional context.
5. The back must directly answer the front.
6. Keep the back concise and useful for revision.
7. Preserve important technical terminology.
8. Prefer exam-relevant concepts.
9. Do not create duplicate or near-duplicate fronts.
10. Do not include unrelated information.
11. Do not use Markdown.
12. Do not mention this prompt.
13. Do not mention Ollama.

--------------------------------------------------
TRUTH TABLE RULE
--------------------------------------------------

If the document contains a truth table:

DO NOT dump the table as a flattened sequence such as:

A B A→B T T T T F F F T F T T F

Instead, summarize the important rule in normal language.

For example:

"The implication P → Q is false only when P is true
and Q is false."

A flashcard answer must be readable by a student.

--------------------------------------------------
ANSWER LENGTH
--------------------------------------------------

Keep the back concise.

Prefer approximately 1–4 sentences.

Do not copy an entire page or large table into the back.

--------------------------------------------------
JSON RULES
--------------------------------------------------

Return ONE JSON OBJECT only.

The object MUST contain exactly:

"front"
"back"

"front" must be a string.

"back" must be a string.

Do NOT return an array.

Do NOT add commentary before or after the JSON.

Example:

{{
  "front": "What is a proposition?",
  "back": "A proposition is a statement that can be either true or false, but not both."
}}

Return JSON only.
"""


# ==================================================
# GENERATE ONE FLASHCARD
# ==================================================

def generate_single_flashcard(
    document_context: str,
    difficulty: str,
    card_number: int,
    previous_fronts: list[str],
) -> dict:
    """
    Generate and validate one flashcard.

    Three attempts are allowed.
    """

    last_error = None

    for attempt in range(
        1,
        4,
    ):

        print(
            f"Flashcard {card_number}: "
            f"generation attempt {attempt}/3..."
        )

        prompt = build_single_flashcard_prompt(
            document_context=document_context,
            difficulty=difficulty,
            card_number=card_number,
            previous_fronts=previous_fronts,
            retry=attempt > 1,
        )

        raw_response = None

        try:

            raw_response = ask_ai(
                prompt,
                json_mode=True,
            )

            flashcard_data = extract_single_flashcard(
                raw_response
            )

            flashcard = validate_single_flashcard(
                flashcard_data
            )

            # --------------------------------------------------
            # Duplicate protection
            # --------------------------------------------------

            for previous_front in previous_fronts:

                if are_duplicate_flashcards(
                    flashcard["front"],
                    previous_front,
                ):

                    raise RuntimeError(
                        "Generated flashcard is a duplicate "
                        "or near-duplicate of an earlier flashcard."
                    )

            print(
                f"Flashcard {card_number}: "
                f"generation succeeded on attempt {attempt}."
            )

            return flashcard

        except Exception as error:

            last_error = error

            print(
                f"Flashcard {card_number}: "
                f"attempt {attempt} failed:",
                error,
            )

            if raw_response is not None:

                print(
                    "\n"
                    "================ RAW OLLAMA FLASHCARD RESPONSE "
                    "================"
                )

                print(
                    raw_response
                )

                print(
                    "================ END RAW OLLAMA RESPONSE "
                    "================\n"
                )

    raise RuntimeError(
        f"Could not generate valid flashcard "
        f"{card_number} after 3 attempts: "
        f"{last_error}"
    )


# ==================================================
# GENERATE FLASHCARDS
# ==================================================

def generate_flashcards(
    retrieved_chunks: list[dict],
    num_cards: int = 5,
    difficulty: str = "medium",
) -> list[dict]:
    """
    Generate document-grounded flashcards.

    Cards are generated one at a time and each card
    uses a different retrieved chunk where possible.
    """

    if not retrieved_chunks:

        raise ValueError(
            "No document context is available "
            "for flashcard generation."
        )

    if not 1 <= num_cards <= 20:

        raise ValueError(
            "Number of flashcards must be between 1 and 20."
        )

    difficulty = difficulty.strip().lower()

    if difficulty not in {
        "easy",
        "medium",
        "hard",
    }:

        raise ValueError(
            "Difficulty must be easy, medium, or hard."
        )

    generated_flashcards = []

    previous_fronts = []

    for card_number in range(
        1,
        num_cards + 1,
    ):

        print(
            "\n"
            f"Preparing flashcard "
            f"{card_number}/{num_cards}..."
        )

        # --------------------------------------------------
        # Rotate through retrieved chunks.
        # --------------------------------------------------

        chunk_index = (
            card_number - 1
        ) % len(retrieved_chunks)

        document_context = format_retrieved_context(
            [
                retrieved_chunks[
                    chunk_index
                ]
            ]
        )

        flashcard = generate_single_flashcard(
            document_context=document_context,
            difficulty=difficulty,
            card_number=card_number,
            previous_fronts=previous_fronts,
        )

        generated_flashcards.append(
            flashcard
        )

        previous_fronts.append(
            flashcard["front"]
        )

    print(
        "\n"
        f"Flashcard generation completed successfully: "
        f"{len(generated_flashcards)} cards."
    )

    return generated_flashcards