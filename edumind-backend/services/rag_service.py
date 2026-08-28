import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

import faiss
import numpy as np


# --------------------------------------------------
# Configuration
# --------------------------------------------------

OLLAMA_EMBED_URL = "http://localhost:11434/api/embed"
EMBEDDING_MODEL = "nomic-embed-text"

BASE_DIR = Path(__file__).resolve().parent.parent
VECTOR_STORE_DIR = BASE_DIR / "vector_store"

VECTOR_STORE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# Chunking Configuration
# --------------------------------------------------

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


# --------------------------------------------------
# Create Chunks
# --------------------------------------------------

def create_chunks(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Split document text into overlapping chunks.

    Overlap helps preserve context between chunks.
    """

    text = text.strip()

    if not text:
        raise ValueError(
            "Cannot create chunks from empty text."
        )

    if overlap >= chunk_size:
        raise ValueError(
            "Chunk overlap must be smaller than chunk size."
        )

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:

        end = min(
            start + chunk_size,
            text_length,
        )

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        start = end - overlap

    return chunks


# --------------------------------------------------
# Ollama Embeddings
# --------------------------------------------------

def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding for one piece of text
    using the local Ollama embedding model.
    """

    text = text.strip()

    if not text:
        raise ValueError(
            "Cannot generate an embedding for empty text."
        )

    payload = {
        "model": EMBEDDING_MODEL,
        "input": text,
    }

    data = json.dumps(payload).encode("utf-8")

    request = Request(
        OLLAMA_EMBED_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(
            request,
            timeout=120,
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
            f"Ollama embedding request failed "
            f"with HTTP {error.code}: {error_body}"
        )

    except URLError as error:

        raise RuntimeError(
            "Could not connect to Ollama embedding service. "
            "Make sure Ollama is running."
        ) from error

    except TimeoutError as error:

        raise RuntimeError(
            "Ollama took too long to generate an embedding."
        ) from error

    try:

        result = json.loads(response_data)

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "Ollama returned an invalid embedding response."
        ) from error

    embeddings = result.get("embeddings")

    if not embeddings:

        raise RuntimeError(
            "Ollama returned an empty embedding."
        )

    embedding = embeddings[0]

    if not embedding:

        raise RuntimeError(
            "Ollama returned an empty vector."
        )

    return embedding


# --------------------------------------------------
# Generate Multiple Embeddings
# --------------------------------------------------

def generate_embeddings(
    texts: list[str],
) -> list[list[float]]:
    """
    Generate embeddings for multiple text chunks.

    Ollama supports sending multiple inputs in one request.
    """

    cleaned_texts = [
        text.strip()
        for text in texts
        if text and text.strip()
    ]

    if not cleaned_texts:
        raise ValueError(
            "No valid text chunks were provided."
        )

    payload = {
        "model": EMBEDDING_MODEL,
        "input": cleaned_texts,
    }

    data = json.dumps(payload).encode("utf-8")

    request = Request(
        OLLAMA_EMBED_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:

        with urlopen(
            request,
            timeout=300,
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
            f"Ollama embedding request failed "
            f"with HTTP {error.code}: {error_body}"
        )

    except URLError as error:

        raise RuntimeError(
            "Could not connect to Ollama embedding service. "
            "Make sure Ollama is running."
        ) from error

    except TimeoutError as error:

        raise RuntimeError(
            "Ollama took too long to generate embeddings."
        ) from error

    try:

        result = json.loads(response_data)

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "Ollama returned an invalid embedding response."
        ) from error

    embeddings = result.get("embeddings")

    if not embeddings:

        raise RuntimeError(
            "Ollama returned empty embeddings."
        )

    if len(embeddings) != len(cleaned_texts):

        raise RuntimeError(
            "Number of embeddings does not match "
            "number of text chunks."
        )

    return embeddings


# --------------------------------------------------
# Vector Store Path
# --------------------------------------------------

def get_vector_store_path(
    material_id: int,
) -> Path:
    """
    Return the directory used to store one material's
    FAISS index and chunk metadata.
    """

    path = (
        VECTOR_STORE_DIR
        / f"material_{material_id}"
    )

    path.mkdir(
        parents=True,
        exist_ok=True,
    )

    return path


# --------------------------------------------------
# Build Material Vector Store
# --------------------------------------------------

def build_vector_store(
    material_id: int,
    text: str,
) -> dict:
    """
    Create a FAISS vector index for a material.

    The index contains embeddings for all document chunks.
    """

    chunks = create_chunks(text)

    embeddings = generate_embeddings(chunks)

    vectors = np.array(
        embeddings,
        dtype="float32",
    )

    if vectors.ndim != 2:
        raise RuntimeError(
            "Invalid embedding dimensions returned by Ollama."
        )

    dimension = vectors.shape[1]

    # Normalize vectors so inner product behaves
    # like cosine similarity.
    faiss.normalize_L2(vectors)

    index = faiss.IndexFlatIP(
        dimension
    )

    index.add(vectors)

    store_path = get_vector_store_path(
        material_id
    )

    index_path = store_path / "index.faiss"

    chunks_path = store_path / "chunks.json"

    faiss.write_index(
        index,
        str(index_path),
    )

    with open(
        chunks_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            chunks,
            file,
            ensure_ascii=False,
            indent=2,
        )

    return {
        "material_id": material_id,
        "chunks": len(chunks),
        "embedding_dimension": dimension,
        "index_path": str(index_path),
    }


# --------------------------------------------------
# Check Vector Store
# --------------------------------------------------

def vector_store_exists(
    material_id: int,
) -> bool:
    """
    Check whether a material already has a vector store.
    """

    store_path = get_vector_store_path(
        material_id
    )

    index_path = store_path / "index.faiss"

    chunks_path = store_path / "chunks.json"

    return (
        index_path.exists()
        and chunks_path.exists()
    )


# --------------------------------------------------
# Load Vector Store
# --------------------------------------------------

def load_vector_store(
    material_id: int,
):
    """
    Load the FAISS index and its corresponding chunks.
    """

    store_path = get_vector_store_path(
        material_id
    )

    index_path = store_path / "index.faiss"

    chunks_path = store_path / "chunks.json"

    if not index_path.exists():
        raise FileNotFoundError(
            "Vector index not found for this material."
        )

    if not chunks_path.exists():
        raise FileNotFoundError(
            "Chunk metadata not found for this material."
        )

    index = faiss.read_index(
        str(index_path)
    )

    with open(
        chunks_path,
        "r",
        encoding="utf-8",
    ) as file:

        chunks = json.load(file)

    return index, chunks


# --------------------------------------------------
# Retrieve Relevant Chunks
# --------------------------------------------------

def retrieve_relevant_chunks(
    material_id: int,
    question: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Find the most relevant document chunks for a question.
    """

    question = question.strip()

    if not question:
        raise ValueError(
            "Question cannot be empty."
        )

    index, chunks = load_vector_store(
        material_id
    )

    question_embedding = generate_embedding(
        question
    )

    query_vector = np.array(
        [question_embedding],
        dtype="float32",
    )

    faiss.normalize_L2(
        query_vector
    )

    actual_top_k = min(
        top_k,
        index.ntotal,
    )

    if actual_top_k == 0:
        return []

    scores, indices = index.search(
        query_vector,
        actual_top_k,
    )

    results = []

    for score, index_position in zip(
        scores[0],
        indices[0],
    ):

        if index_position < 0:
            continue

        if index_position >= len(chunks):
            continue

        results.append(
            {
                "chunk": chunks[index_position],
                "score": float(score),
                "chunk_index": int(
                    index_position
                ),
            }
        )

    return results


# --------------------------------------------------
# Delete Vector Store
# --------------------------------------------------

def delete_vector_store(
    material_id: int,
) -> None:
    """
    Delete all vector data associated with a material.
    """

    store_path = (
        VECTOR_STORE_DIR
        / f"material_{material_id}"
    )

    if not store_path.exists():
        return

    for file in store_path.iterdir():

        if file.is_file():
            file.unlink()

    store_path.rmdir()