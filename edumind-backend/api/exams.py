from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.material import Material
from models.user import User

from services.ai_service import generate_quiz, extract_document_text
from services.rag_service import (
    build_vector_store,
    vector_store_exists,
    retrieve_relevant_chunks,
)


router = APIRouter(
    prefix="/api/exams",
    tags=["Mock Exams"],
)


# ==================================================
# REQUEST MODELS
# ==================================================


class ExamCreateRequest(BaseModel):
    material_id: int = Field(
        ...,
        ge=1,
    )

    num_questions: Literal[
        10,
        20,
    ] = 10

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"

    time_limit: Literal[
        15,
        30,
        60,
    ] = 30


class ExamAnswer(BaseModel):
    question_index: int = Field(
        ...,
        ge=0,
    )

    answer: str = ""


class ExamSubmitRequest(BaseModel):
    exam_id: str = Field(
        ...,
        min_length=1,
    )

    answers: list[ExamAnswer] = Field(
        default_factory=list,
    )


# ==================================================
# HELPER - GET USER MATERIAL
# ==================================================


def get_user_material(
    material_id: int,
    current_user: User,
    db: Session,
) -> Material:

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id,
            Material.user_id == current_user.id,
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    return material


# ==================================================
# HELPER - GET MATERIAL FILE
# ==================================================


def get_material_file_path(
    material: Material,
) -> str:

    if not material.file_path:
        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    from pathlib import Path

    base_dir = Path(__file__).resolve().parent.parent
    file_path = base_dir / material.file_path

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    return str(file_path)


# ==================================================
# POST - CREATE MOCK EXAM
# ==================================================


@router.post("/create")
def create_mock_exam(
    request: ExamCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a complete AI-powered mock exam
    from one selected study material.
    """

    material = get_user_material(
        material_id=request.material_id,
        current_user=current_user,
        db=db,
    )

    file_path = get_material_file_path(
        material,
    )

    try:

        # --------------------------------------------------
        # Make sure the material has a RAG index.
        # --------------------------------------------------

        if not vector_store_exists(
            request.material_id,
        ):

            extracted_text = extract_document_text(
                file_path,
            )

            if not extracted_text.strip():
                raise RuntimeError(
                    "No extractable text was found in this material."
                )

            build_vector_store(
                request.material_id,
                extracted_text,
            )

        # --------------------------------------------------
        # Retrieve exam-relevant material.
        # --------------------------------------------------

        retrieval_query = (
            "important concepts, definitions, key facts, "
            "principles, applications, examples, comparisons, "
            "and exam-relevant topics from this study material"
        )

        retrieved_chunks = retrieve_relevant_chunks(
            material_id=request.material_id,
            question=retrieval_query,
            top_k=10,
        )

        if not retrieved_chunks:
            raise RuntimeError(
                "No relevant study content could be retrieved "
                "from this material."
            )

        # --------------------------------------------------
        # Generate questions using existing AI engine.
        # --------------------------------------------------

        questions = generate_quiz(
            retrieved_chunks=retrieved_chunks,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
        )

        if not questions:
            raise RuntimeError(
                "The AI did not generate any exam questions."
            )

        # --------------------------------------------------
        # Create temporary exam ID.
        #
        # For this first implementation the generated exam
        # is returned directly to the frontend. Persistent
        # exam history can be added separately later.
        # --------------------------------------------------

        exam_id = uuid4().hex

        # --------------------------------------------------
        # Remove correct answers from the active exam.
        #
        # The browser must NOT receive the correct answer
        # before the student submits the exam.
        # --------------------------------------------------

        exam_questions = []

        for index, question in enumerate(
            questions,
            start=1,
        ):

            exam_questions.append(
                {
                    "question_index": index,
                    "question": question.get(
                        "question",
                        "",
                    ),
                    "options": question.get(
                        "options",
                        [],
                    ),
                }
            )

        return {
            "exam_id": exam_id,
            "material_id": material.id,
            "material_title": material.title,
            "num_questions": len(exam_questions),
            "difficulty": request.difficulty,
            "time_limit": request.time_limit,
            "time_limit_seconds": request.time_limit * 60,
            "questions": exam_questions,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            f"Mock exam generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate mock exam. "
                f"{error}"
            ),
        )


# ==================================================
# POST - SUBMIT MOCK EXAM
# ==================================================


@router.post("/submit")
def submit_mock_exam(
    request: ExamSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluate a mock exam submission.

    NOTE:
    The current implementation expects the frontend to send
    the generated exam questions together with the answers
    in a future persistent exam implementation.

    This endpoint is intentionally kept separate from exam
    generation so evaluation can be expanded without changing
    the exam creation API.
    """

    if not request.answers:
        raise HTTPException(
            status_code=400,
            detail="No answers were submitted.",
        )

    return {
        "exam_id": request.exam_id,
        "message": (
            "Exam submission endpoint is ready. "
            "Persistent answer evaluation will be connected "
            "when exam state storage is added."
        ),
        "submitted_answers": len(
            request.answers
        ),
    }