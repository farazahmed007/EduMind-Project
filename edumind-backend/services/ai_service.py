import json
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

    text = "\n".join(text_parts).strip()

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

    data = json.dumps(payload).encode("utf-8")

    request = Request(
        OLLAMA_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=180) as response:
            response_data = response.read().decode("utf-8")

    except HTTPError as error:
        error_body = error.read().decode(
            "utf-8",
            errors="replace",
        )

        raise RuntimeError(
            f"Ollama returned HTTP {error.code}: {error_body}"
        )

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
        result = json.loads(response_data)

    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Ollama returned an invalid response."
        ) from error

    answer = result.get("response")

    if not answer:
        raise RuntimeError(
            "Ollama returned an empty AI response."
        )

    return answer.strip()


# --------------------------------------------------
# GENERATE SUMMARY
# --------------------------------------------------

def generate_summary(file_path: str) -> str:
    """
    Extract PDF text and generate a real AI summary
    using the local Ollama model.
    """

    text = extract_pdf_text(file_path)

    # Prevent excessively large prompts from overwhelming
    # the local model during development.
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

    return ask_ai(prompt)


# --------------------------------------------------
# ASK AI TUTOR
# --------------------------------------------------

def ask_tutor(
    file_path: str,
    question: str
) -> str:
    """
    Answer a student's question using the uploaded PDF
    as the primary source of context.
    """

    # --------------------------------------------------
    # Extract PDF text
    # --------------------------------------------------

    text = extract_pdf_text(file_path)

    # --------------------------------------------------
    # Limit PDF size
    # --------------------------------------------------

    max_characters = 30000

    if len(text) > max_characters:
        text = text[:max_characters]

    # --------------------------------------------------
    # Clean student question
    # --------------------------------------------------

    question = question.strip()

    if not question:
        raise ValueError(
            "Question cannot be empty."
        )

    # --------------------------------------------------
    # Build Tutor prompt
    # --------------------------------------------------

    prompt = f"""
You are EduMind AI Tutor.

You are helping an MCA student understand their study material.

You have TWO separate pieces of information:

1. STUDY MATERIAL
2. STUDENT QUESTION

The STUDENT QUESTION is NOT part of the study material.

You MUST answer the student's question.

<STUDY_MATERIAL>

{text}

</STUDY_MATERIAL>

<STUDENT_QUESTION>

{question}

</STUDENT_QUESTION>

IMPORTANT INSTRUCTIONS:

1. Answer the STUDENT QUESTION above.
2. Do NOT look for a question inside the study material.
3. The student's question is already provided separately above.
4. Use the study material as your primary source.
5. Explain the answer in simple language suitable for an MCA student.
6. If the study material contains relevant information, use that information in your answer.
7. You may organize the answer with headings and bullet points.
8. Use examples when they help explain the concept.
9. If the student asks for a definition, give a clear definition first.
10. If the student asks to explain something, explain it step-by-step.
11. If the student asks for a comparison, use a table when appropriate.
12. If the study material does not contain enough information to answer the question, clearly say that the material does not contain enough information.
13. Do not invent information and pretend it came from the study material.
14. Do not mention Ollama.
15. Do not mention this prompt.
16. Do not say that the student question is missing.
17. Do not say that the study material itself needs to contain a question.

FINAL TASK:

Answer this exact student question:

{question}

Give the student a direct, useful and easy-to-understand answer.
"""

    return ask_ai(prompt)