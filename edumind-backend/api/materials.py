from typing import Literal

from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Depends,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from uuid import uuid4
from pydantic import BaseModel, Field

from services.ai_service import (
    generate_summary,
    ask_tutor,
    extract_pdf_text,
    generate_quiz,
    generate_flashcards,
)

from services.rag_service import (
    build_vector_store,
    vector_store_exists,
    retrieve_relevant_chunks,
    delete_vector_store,
)

from core.database import get_db
from models.material import Material


router = APIRouter(
    prefix="/api/materials",
    tags=["Materials"],
)


# --------------------------------------------------
# Request Models
# --------------------------------------------------

class TutorMessage(BaseModel):
    role: str
    content: str


class TutorRequest(BaseModel):
    question: str
    conversation_history: list[TutorMessage] = Field(
        default_factory=list
    )


class QuizRequest(BaseModel):
    num_questions: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


class FlashcardRequest(BaseModel):
    num_cards: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# GET ALL MATERIALS
# --------------------------------------------------

@router.get("/")
def get_materials(
    db: Session = Depends(get_db),
):
    materials = (
        db.query(Material)
        .order_by(Material.id.desc())
        .all()
    )

    return materials


# --------------------------------------------------
# POST - UPLOAD MATERIAL
# --------------------------------------------------

@router.post("/")
async def create_material(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    # --------------------------------------------------
    # Get extension
    # --------------------------------------------------

    extension = (
        Path(file.filename)
        .suffix
        .replace(".", "")
        .upper()
    )

    # --------------------------------------------------
    # Convert file extensions to frontend types
    # --------------------------------------------------

    if extension == "PPTX":

        material_type = "PPT"

    elif extension == "DOCX":

        material_type = "DOC"

    else:

        material_type = extension

    # --------------------------------------------------
    # Generate unique filename
    # --------------------------------------------------

    unique_filename = (
        f"{uuid4().hex}"
        f"{Path(file.filename).suffix.lower()}"
    )

    file_path = (
        UPLOAD_DIR
        / unique_filename
    )

    # --------------------------------------------------
    # Save physical file
    # --------------------------------------------------

    content = await file.read()

    with open(
        file_path,
        "wb",
    ) as buffer:

        buffer.write(content)

    # --------------------------------------------------
    # Create database record
    # --------------------------------------------------

    new_material = Material(
        title=file.filename,
        type=material_type,
        size=f"{len(content) / (1024 * 1024):.2f} MB",
        time="Just now",
        file_path=f"uploads/{unique_filename}",
    )

    db.add(
        new_material
    )

    db.commit()

    db.refresh(
        new_material
    )

    # --------------------------------------------------
    # Build RAG index for PDF files
    # --------------------------------------------------

    if material_type == "PDF":

        try:

            extracted_text = extract_pdf_text(
                str(file_path)
            )

            rag_result = build_vector_store(
                new_material.id,
                extracted_text,
            )

            print(
                "RAG vector store created:",
                rag_result,
            )

        except Exception as error:

            print(
                "RAG indexing error:",
                error,
            )

            # The material itself is still kept.
            # RAG can be created later when needed.

    return new_material


# --------------------------------------------------
# GET - OPEN MATERIAL FILE
# --------------------------------------------------

@router.get("/{material_id}/file")
def get_material_file(
    material_id: int,
    db: Session = Depends(get_db),
):

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if not material.file_path:

        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    file_path = (
        BASE_DIR
        / material.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    # --------------------------------------------------
    # Determine MIME type
    # --------------------------------------------------

    suffix = file_path.suffix.lower()

    media_types = {
        ".pdf": "application/pdf",

        ".ppt": (
            "application/vnd.ms-powerpoint"
        ),

        ".pptx": (
            "application/vnd.openxmlformats-officedocument."
            "presentationml.presentation"
        ),

        ".doc": "application/msword",

        ".docx": (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),

        ".txt": "text/plain",
    }

    media_type = media_types.get(
        suffix,
        "application/octet-stream",
    )

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": "inline",
        },
    )


# --------------------------------------------------
# DELETE MATERIAL
# --------------------------------------------------

@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
):

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    # --------------------------------------------------
    # Delete physical file
    # --------------------------------------------------

    if material.file_path:

        file_path = (
            BASE_DIR
            / material.file_path
        )

        if file_path.exists():
            file_path.unlink()

    # --------------------------------------------------
    # Delete vector store
    # --------------------------------------------------

    try:

        delete_vector_store(
            material_id
        )

    except Exception as error:

        print(
            "Vector store deletion error:",
            error,
        )

    # --------------------------------------------------
    # Delete database record
    # --------------------------------------------------

    db.delete(
        material
    )

    db.commit()

    return {
        "message": "Material deleted successfully",
        "id": material_id,
    }


# --------------------------------------------------
# PATCH - RENAME MATERIAL
# --------------------------------------------------

@router.patch("/{material_id}")
def rename_material(
    material_id: int,
    new_title: str,
    db: Session = Depends(get_db),
):

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    material.title = new_title

    db.commit()

    db.refresh(
        material
    )

    return material


# --------------------------------------------------
# POST - GENERATE AI SUMMARY
# --------------------------------------------------

@router.post("/{material_id}/summary")
def generate_material_summary(
    material_id: int,
    db: Session = Depends(get_db),
):

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if not material.file_path:

        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    file_path = (
        BASE_DIR
        / material.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    try:

        summary = generate_summary(
            str(file_path)
        )

        return {
            "material_id": material_id,
            "title": material.title,
            "summary": summary,
        }

    except Exception as error:

        print(
            f"Summary generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate summary.",
        )


# --------------------------------------------------
# POST - ASK AI TUTOR
# --------------------------------------------------

@router.post("/{material_id}/tutor")
def ask_material_tutor(
    material_id: int,
    request: TutorRequest,
    db: Session = Depends(get_db),
):
    """
    Answer a student's question using document-grounded
    retrieval and conversation history.
    """

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if not material.file_path:

        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    file_path = (
        BASE_DIR
        / material.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    if material.type != "PDF":

        raise HTTPException(
            status_code=400,
            detail=(
                "Document-grounded AI Tutor is currently "
                "available for PDF materials."
            ),
        )

    try:

        if not vector_store_exists(
            material_id
        ):

            print(
                f"Creating RAG index for material "
                f"{material_id}..."
            )

            extracted_text = extract_pdf_text(
                str(file_path)
            )

            build_vector_store(
                material_id,
                extracted_text,
            )

            print(
                f"RAG index created for material "
                f"{material_id}."
            )

        from services.ai_service import rewrite_tutor_query

        conversation_history = [
            message.model_dump()
            for message in request.conversation_history
        ]

        rewritten_query = rewrite_tutor_query(
            question=question,
            conversation_history=conversation_history,
        )

        print(
            "Original tutor question:",
            question,
        )

        print(
            "Rewritten retrieval query:",
            rewritten_query,
        )

        retrieved_chunks = retrieve_relevant_chunks(
            material_id=material_id,
            question=rewritten_query,
            top_k=5,
        )

        print(
            f"Retrieved {len(retrieved_chunks)} "
            f"relevant chunks for material "
            f"{material_id}."
        )

        answer = ask_tutor(
            question=question,
            retrieved_chunks=retrieved_chunks,
            conversation_history=conversation_history,
        )

        return {
            "material_id": material_id,
            "title": material.title,
            "question": question,
            "answer": answer,
            "sources": [
                {
                    "chunk_index": item["chunk_index"],
                    "score": item["score"],
                }
                for item in retrieved_chunks
            ],
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            f"AI Tutor generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate AI Tutor response."
            ),
        )


# --------------------------------------------------
# POST - GENERATE AI QUIZ
# --------------------------------------------------

@router.post("/{material_id}/quiz")
def generate_material_quiz(
    material_id: int,
    request: QuizRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a document-grounded multiple-choice quiz
    from the selected PDF material.
    """

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if not material.file_path:

        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    if material.type != "PDF":

        raise HTTPException(
            status_code=400,
            detail=(
                "Document-grounded quiz generation is "
                "currently available for PDF materials."
            ),
        )

    file_path = (
        BASE_DIR
        / material.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    try:

        if not vector_store_exists(
            material_id
        ):

            print(
                f"Creating RAG index for quiz generation "
                f"for material {material_id}..."
            )

            extracted_text = extract_pdf_text(
                str(file_path)
            )

            build_vector_store(
                material_id,
                extracted_text,
            )

            print(
                f"RAG index created for material "
                f"{material_id}."
            )

        retrieval_query = (
            "important concepts, definitions, key facts, "
            "applications, principles, examples, and exam-relevant "
            "topics from this study material"
        )

        print(
            "Quiz retrieval query:",
            retrieval_query,
        )

        retrieved_chunks = retrieve_relevant_chunks(
            material_id=material_id,
            question=retrieval_query,
            top_k=8,
        )

        print(
            f"Retrieved {len(retrieved_chunks)} "
            f"chunks for quiz generation "
            f"for material {material_id}."
        )

        quiz = generate_quiz(
            retrieved_chunks=retrieved_chunks,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
        )

        return {
            "material_id": material_id,
            "title": material.title,
            "num_questions": len(quiz),
            "difficulty": request.difficulty,
            "questions": quiz,
            "sources": [
                {
                    "chunk_index": item["chunk_index"],
                    "score": item["score"],
                }
                for item in retrieved_chunks
            ],
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            f"Quiz generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate quiz: {error}",
        )


# --------------------------------------------------
# POST - GENERATE AI FLASHCARDS
# --------------------------------------------------

@router.post("/{material_id}/flashcards")
def generate_material_flashcards(
    material_id: int,
    request: FlashcardRequest,
    db: Session = Depends(get_db),
):
    """
    Generate document-grounded flashcards
    from the selected PDF material.
    """

    # --------------------------------------------------
    # Find Material
    # --------------------------------------------------

    material = (
        db.query(Material)
        .filter(
            Material.id == material_id
        )
        .first()
    )

    if not material:

        raise HTTPException(
            status_code=404,
            detail="Material not found.",
        )

    if not material.file_path:

        raise HTTPException(
            status_code=404,
            detail="File is not available for this material.",
        )

    # --------------------------------------------------
    # Flashcards currently support PDFs
    # --------------------------------------------------

    if material.type != "PDF":

        raise HTTPException(
            status_code=400,
            detail=(
                "Document-grounded flashcard generation is "
                "currently available for PDF materials."
            ),
        )

    # --------------------------------------------------
    # Physical file
    # --------------------------------------------------

    file_path = (
        BASE_DIR
        / material.file_path
    )

    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Physical file not found.",
        )

    try:

        # --------------------------------------------------
        # Create RAG index if necessary
        # --------------------------------------------------

        if not vector_store_exists(
            material_id
        ):

            print(
                f"Creating RAG index for flashcard generation "
                f"for material {material_id}..."
            )

            extracted_text = extract_pdf_text(
                str(file_path)
            )

            build_vector_store(
                material_id,
                extracted_text,
            )

            print(
                f"RAG index created for material "
                f"{material_id}."
            )

        # --------------------------------------------------
        # Retrieve broad flashcard-generation context
        # --------------------------------------------------

        retrieval_query = (
            "important concepts, definitions, key facts, "
            "terms, principles, examples, applications, "
            "and exam-relevant topics for revision "
            "from this study material"
        )

        print(
            "Flashcard retrieval query:",
            retrieval_query,
        )

        retrieved_chunks = retrieve_relevant_chunks(
            material_id=material_id,
            question=retrieval_query,
            top_k=8,
        )

        print(
            f"Retrieved {len(retrieved_chunks)} "
            f"chunks for flashcard generation "
            f"for material {material_id}."
        )

        if not retrieved_chunks:

            raise RuntimeError(
                "No relevant document context was retrieved "
                "for flashcard generation."
            )

        # --------------------------------------------------
        # Generate Flashcards
        # --------------------------------------------------

        flashcards = generate_flashcards(
            retrieved_chunks=retrieved_chunks,
            num_cards=request.num_cards,
            difficulty=request.difficulty,
        )

        return {
            "material_id": material_id,
            "title": material.title,
            "num_cards": len(flashcards),
            "difficulty": request.difficulty,
            "flashcards": flashcards,
            "sources": [
                {
                    "chunk_index": item["chunk_index"],
                    "score": item["score"],
                }
                for item in retrieved_chunks
            ],
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            f"Flashcard generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to generate flashcards: {error}"
            ),
        )