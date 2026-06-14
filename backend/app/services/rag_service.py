import json
import numpy as np

from app.services.embedding_service import create_embedding


def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    return np.dot(vec1, vec2) / (
        np.linalg.norm(vec1) *
        np.linalg.norm(vec2)
    )


def retrieve_relevant_chunks(
    question: str,
    chunks: list,
    top_k: int = 3
):
    question_embedding = create_embedding(question)

    scored_chunks = []

    for idx, chunk in enumerate(chunks):
        chunk_embedding = json.loads(chunk.embedding)

        score = cosine_similarity(
            question_embedding,
            chunk_embedding
        )

        scored_chunks.append({
            "score": score,
            "chunk_text": chunk.chunk_text,
            "index": idx + 1
        })

    scored_chunks.sort(
        reverse=True,
        key=lambda x: x["score"]
    )

    return scored_chunks[:top_k]