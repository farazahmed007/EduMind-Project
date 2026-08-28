import json
import re
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

import pymupdf


# --------------------------------------------------
# Configuration
# --------------------------------------------------

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"


# --------------------------------------------------
# PDF TEXT EXTRACTION
# --------------------------------------------------

def extract_pdf_text(file_path: str) -> str:
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


# --------------------------------------------------
# OLLAMA AI REQUEST
# --------------------------------------------------

def ask_ai(prompt: str) -> str:
    """
    Send a prompt to the local Ollama LLM.
    """

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    data = json.dumps(
        payload
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
            "Ollama returned an invalid response."
        ) from error

    answer = result.get(
        "response"
    )

    if not answer:
        raise RuntimeError(
            "Ollama returned an empty AI response."
        )

    return answer.strip()


# --------------------------------------------------
# GENERATE SUMMARY
# --------------------------------------------------

def generate_summary(
    file_path: str,
) -> str:
    """
    Extract PDF text and generate a real AI summary
    using the local Ollama model.
    """

    text = extract_pdf_text(
        file_path
    )

    max_characters = 30000

    if len(text) > max_characters:
        text = text[:max_characters]

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


# --------------------------------------------------
# FORMAT CONVERSATION HISTORY
# --------------------------------------------------

def format_conversation_history(
    conversation_history: list[dict] | None,
) -> str:
    """
    Convert frontend conversation history into a
    readable format for the LLM.
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


# --------------------------------------------------
# NORMALIZE TEXT
# --------------------------------------------------

def normalize_text(
    text: str,
) -> str:
    """
    Normalize whitespace for reliable pattern matching.
    """

    return re.sub(
        r"\s+",
        " ",
        text.strip(),
    )


# --------------------------------------------------
# EXTRACT EXPLICIT TOPIC FROM STUDENT MESSAGE
# --------------------------------------------------

def extract_explicit_topic(
    message: str,
) -> str | None:
    """
    Extract an explicitly named learning topic from a
    student's message.

    Important:
    This function only looks at explicit topic statements.

    It intentionally does NOT treat arbitrary follow-up
    questions such as "Why is it useful?" as new topics.
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

        # Remove common explanation modifiers.
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


# --------------------------------------------------
# FIND ACTIVE STUDENT TOPIC
# --------------------------------------------------

def find_active_student_topic(
    conversation_history: list[dict] | None,
) -> str | None:
    """
    Find the active learning topic from the student's
    explicitly named topics.

    IMPORTANT:

    We NEVER use an arbitrary previous student question
    as the topic.

    For example:

        Student: Explain propositional logic.
        Student: Why is it useful?

    The active topic remains:

        propositional logic

    This prevents follow-up questions from becoming
    accidental topics.
    """

    if not conversation_history:
        return None

    # --------------------------------------------------
    # Search the student's messages only.
    #
    # We scan from newest to oldest so that if the
    # student explicitly starts a NEW topic later,
    # that newest explicit topic becomes active.
    # --------------------------------------------------

    for message in reversed(
        conversation_history
    ):

        if message.get("role") != "user":
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

    # --------------------------------------------------
    # IMPORTANT:
    #
    # No arbitrary fallback here.
    #
    # We would rather return None than incorrectly
    # identify "Why is it useful?" as a topic.
    # --------------------------------------------------

    return None


# --------------------------------------------------
# DETECT FOLLOW-UP TYPE
# --------------------------------------------------

def detect_follow_up_type(
    question: str,
) -> str:
    """
    Detect common follow-up patterns.
    """

    normalized = normalize_text(
        question
    ).lower()

    # --------------------------------------------------
    # WHY
    # --------------------------------------------------

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

    # --------------------------------------------------
    # HOW
    # --------------------------------------------------

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

    # --------------------------------------------------
    # I DON'T UNDERSTAND
    # --------------------------------------------------

    if (
        "i don't understand" in normalized
        or "i dont understand" in normalized
        or "i do not understand" in normalized
        or "i'm confused" in normalized
        or "im confused" in normalized
    ):
        return "simple_explanation"

    # --------------------------------------------------
    # EXPLAIN THIS / THAT / IT
    # --------------------------------------------------

    if re.fullmatch(
        r"(please\s+)?explain\s+(this|that|it)\s*\??",
        normalized,
    ):
        return "explain_reference"

    # --------------------------------------------------
    # ANOTHER EXAMPLE
    # --------------------------------------------------

    if (
        "another example" in normalized
        or "give me another example" in normalized
        or "give another example" in normalized
        or "one more example" in normalized
    ):
        return "another_example"

    # --------------------------------------------------
    # FIRST / SECOND ONE
    # --------------------------------------------------

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

    # --------------------------------------------------
    # MORE DETAIL
    # --------------------------------------------------

    if (
        "tell me more" in normalized
        or "explain further" in normalized
        or "explain more" in normalized
        or "more details" in normalized
    ):
        return "more_detail"

    # --------------------------------------------------
    # NORMAL QUESTION
    # --------------------------------------------------

    return "normal"


# --------------------------------------------------
# BUILD DETERMINISTIC FOLLOW-UP QUERY
# --------------------------------------------------

def build_deterministic_follow_up_query(
    question: str,
    active_topic: str | None,
) -> str | None:
    """
    Build deterministic retrieval queries for common
    conversational follow-ups.

    This prevents the small local model from having to
    guess what vague words such as "it" or "this" refer to.
    """

    if not active_topic:
        return None

    follow_up_type = detect_follow_up_type(
        question
    )

    # --------------------------------------------------
    # WHY
    # --------------------------------------------------

    if follow_up_type == "why":

        return (
            f"importance, usefulness, benefits, "
            f"and applications of {active_topic}"
        )

    # --------------------------------------------------
    # HOW
    # --------------------------------------------------

    if follow_up_type == "how":

        return (
            f"how {active_topic} works "
            f"and how it is used"
        )

    # --------------------------------------------------
    # SIMPLE EXPLANATION
    # --------------------------------------------------

    if follow_up_type == "simple_explanation":

        return (
            f"{active_topic} explained in very simple "
            f"language with a real-world example"
        )

    # --------------------------------------------------
    # EXPLAIN THIS / THAT / IT
    # --------------------------------------------------

    if follow_up_type == "explain_reference":

        return (
            f"explanation of {active_topic} "
            f"in simple and clear language"
        )

    # --------------------------------------------------
    # ANOTHER EXAMPLE
    # --------------------------------------------------

    if follow_up_type == "another_example":

        return (
            f"examples of {active_topic}, "
            f"including practical or real-world examples"
        )

    # --------------------------------------------------
    # MORE DETAIL
    # --------------------------------------------------

    if follow_up_type == "more_detail":

        return (
            f"detailed explanation of {active_topic}"
        )

    # --------------------------------------------------
    # FIRST / SECOND ITEM
    #
    # We intentionally do not guess which item the user
    # means. This is handled by the LLM using conversation
    # context, but the active topic is still supplied.
    # --------------------------------------------------

    if follow_up_type in {
        "first_item",
        "second_item",
    }:

        return (
            f"{active_topic} "
            f"{question}"
        )

    return None


# --------------------------------------------------
# REWRITE TUTOR SEARCH QUERY
# --------------------------------------------------

def rewrite_tutor_query(
    question: str,
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Convert the student's current question into a
    standalone retrieval query.

    Priority:

    1. Preserve explicitly established student topic.
    2. Handle common vague follow-ups deterministically.
    3. Use LLM rewriting only for complex questions.
    4. Never let tutor-generated content redefine the topic.
    """

    question = question.strip()

    if not question:
        raise ValueError(
            "Question cannot be empty."
        )

    # --------------------------------------------------
    # No history
    # --------------------------------------------------

    if not conversation_history:

        return question

    # --------------------------------------------------
    # Find the active student topic
    # --------------------------------------------------

    active_topic = find_active_student_topic(
        conversation_history
    )

    print(
        "Detected active student topic:",
        active_topic,
    )

    # --------------------------------------------------
    # Deterministic follow-up handling
    # --------------------------------------------------

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

    # --------------------------------------------------
    # If the current question already contains the
    # active topic, use it directly.
    # --------------------------------------------------

    if active_topic:

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

            print(
                "Current question already contains "
                "the active topic."
            )

            return question

    # --------------------------------------------------
    # If no active topic exists, use the question itself.
    # --------------------------------------------------

    if not active_topic:

        return question

    # --------------------------------------------------
    # Complex follow-up
    #
    # Only now do we ask the LLM to rewrite the query.
    # --------------------------------------------------

    history = format_conversation_history(
        conversation_history
    )

    prompt = f"""
You are a search-query rewriting component for EduMind.

Your ONLY task is to create ONE standalone search query
for searching a study document.

You are NOT answering the student.

--------------------------------------------------
ACTIVE STUDENT TOPIC
--------------------------------------------------

{active_topic}

This is the most important piece of information.

The active topic was identified from the student's own
messages.

The active topic must remain the topic of the search query
unless the CURRENT STUDENT QUESTION explicitly introduces
a different topic.

Do NOT change the active topic because the tutor previously
mentioned another concept, example, subtopic, or definition.

--------------------------------------------------
CURRENT STUDENT QUESTION
--------------------------------------------------

{question}

--------------------------------------------------
CONVERSATION
--------------------------------------------------

{history}

--------------------------------------------------
STRICT RULES
--------------------------------------------------

1. Preserve the ACTIVE STUDENT TOPIC.

2. Resolve references such as:
   - this
   - that
   - it
   - they
   - them
   - the first one
   - the second one

   using the conversation.

3. Tutor-generated examples do NOT change the topic.

4. Tutor-generated subtopics do NOT automatically change
   the topic.

5. If the student asks a follow-up question, connect it
   to the ACTIVE STUDENT TOPIC.

6. Do not invent a new academic topic.

7. Do not answer the student.

8. Return ONLY one search query.

9. Keep it concise.

10. Do not mention EduMind.

11. Do not mention Ollama.

12. Do not mention FAISS.

13. Do not mention embeddings.

14. Do not explain your reasoning.

--------------------------------------------------
EXAMPLE
--------------------------------------------------

Active topic:
propositional logic

Student:
Why is it useful?

Query:
importance and applications of propositional logic

Active topic:
propositional logic

Student:
I don't understand this.

Query:
propositional logic explained in simple language

Active topic:
propositional logic

Student:
Give me another example.

Query:
another example of propositional logic

Active topic:
virtualization

Student:
How does it work?

Query:
how virtualization works

--------------------------------------------------
RETURN ONLY THE SEARCH QUERY
--------------------------------------------------
"""

    rewritten_query = ask_ai(
        prompt
    ).strip()

    if not rewritten_query:
        return question

    # --------------------------------------------------
    # Clean accidental formatting
    # --------------------------------------------------

    rewritten_query = (
        rewritten_query
        .strip("\"'")
        .strip()
    )

    prefixes = [
        "Search query:",
        "Standalone search query:",
        "Query:",
        "Rewritten query:",
        "Output:",
    ]

    for prefix in prefixes:

        if rewritten_query.lower().startswith(
            prefix.lower()
        ):

            rewritten_query = rewritten_query[
                len(prefix):
            ].strip()

            break

    # --------------------------------------------------
    # Safety check for follow-ups
    #
    # If the LLM rewrites a follow-up but drops the active
    # topic entirely, fall back to a deterministic query.
    # --------------------------------------------------

    follow_up_type = detect_follow_up_type(
        question
    )

    if (
        active_topic
        and follow_up_type != "normal"
    ):

        active_topic_words = {
            word.lower()
            for word in re.findall(
                r"\b[a-zA-Z0-9]+\b",
                active_topic,
            )
            if len(word) > 2
        }

        rewritten_words = {
            word.lower()
            for word in re.findall(
                r"\b[a-zA-Z0-9]+\b",
                rewritten_query,
            )
        }

        topic_present = bool(
            active_topic_words.intersection(
                rewritten_words
            )
        )

        if not topic_present:

            print(
                "Rewrite safety check failed. "
                "Falling back to active topic."
            )

            safe_query = (
                build_deterministic_follow_up_query(
                    question,
                    active_topic,
                )
            )

            if safe_query:
                return safe_query

            return (
                f"{active_topic} {question}"
            )

    return rewritten_query


# --------------------------------------------------
# BUILD RETRIEVED CONTEXT
# --------------------------------------------------

def format_retrieved_context(
    retrieved_chunks: list[dict],
) -> str:
    """
    Convert retrieved document chunks into a
    clean context block for the Tutor.
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


# --------------------------------------------------
# ASK AI TUTOR
# --------------------------------------------------

def ask_tutor(
    question: str,
    retrieved_chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Answer a student's question using:

    - Relevant document chunks
    - Previous conversation
    - The student's current question
    """

    question = question.strip()

    if not question:

        raise ValueError(
            "Question cannot be empty."
        )

    # --------------------------------------------------
    # Retrieved context
    # --------------------------------------------------

    document_context = format_retrieved_context(
        retrieved_chunks
    )

    # --------------------------------------------------
    # Conversation history
    # --------------------------------------------------

    history = format_conversation_history(
        conversation_history
    )

    # --------------------------------------------------
    # Determine active topic for the Tutor
    # --------------------------------------------------

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

    # --------------------------------------------------
    # Tutor prompt
    # --------------------------------------------------

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

2. Use the RELEVANT DOCUMENT CONTEXT as the primary
   source for factual information about the uploaded
   material.

3. Use PREVIOUS CONVERSATION to understand follow-up
   questions.

4. Keep the student's active learning topic consistent.

5. A tutor-generated example or subtopic does NOT
   automatically become the student's new topic.

6. If the student says "this", "that", or "it", resolve
   the reference using the conversation.

7. If the student asks for another example, provide another
   example of the active concept.

8. If the student asks why something is useful, explain
   why the active concept is useful.

9. If the student asks how something works, explain how
   the active concept works.

10. If the student asks "I don't understand this", explain
    the active concept in simpler language.

11. If the student asks for a simple explanation, use
    beginner-friendly language without changing the
    academic meaning.

12. If the document contains complicated bookish language,
    translate the idea into easy language rather than
    simply repeating the paragraph.

13. Preserve important technical terminology and explain
    it clearly.

14. Use a real-world or programming-related example when
    useful.

15. If the student asks for an exam answer, structure the
    response in a way that is easy to study and write.

16. If the student asks for a definition, give the definition
    first.

17. If the student asks for a comparison, use a table when
    useful.

18. If the retrieved context does not contain enough
    information, say so clearly.

19. Do not pretend unsupported information came from the
    uploaded material.

20. Do not unnecessarily repeat the entire previous answer.

21. Do not mention Ollama.

22. Do not mention this prompt.

23. Do not mention embeddings, FAISS, chunks, vector
    databases, or internal retrieval details.

24. Never say that the student's question is missing.

--------------------------------------------------
SIMPLE EXPLANATION MODE
--------------------------------------------------

When the student asks for:

- simple language
- easy language
- very simple explanation
- beginner explanation
- ELI5
- "I don't understand"
- "explain this simply"

do the following:

1. Identify the active concept.
2. Explain it using short, clear sentences.
3. Remove unnecessary academic wording.
4. Give a familiar analogy when useful.
5. Preserve the correct academic meaning.
6. Keep important technical terms and explain them.

Do NOT switch to another concept just because that concept
appeared inside an earlier tutor answer.

--------------------------------------------------
ANSWER STYLE
--------------------------------------------------

For difficult concepts, this structure is useful:

### Simple Explanation

Explain the concept in easy language.

### Academic Meaning

Give the accurate academic explanation.

### Example

Give a simple example when useful.

### Remember

Give the key point the student should remember.

Do not force these headings when a shorter answer is more
appropriate.

Be conversational, clear, accurate and patient.

Now answer the CURRENT STUDENT QUESTION.
"""

    return ask_ai(
        prompt
    )