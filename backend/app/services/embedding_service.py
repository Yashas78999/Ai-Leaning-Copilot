from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def chunk_text(
    text: str,
    chunk_size: int = 1000
):
    chunks = []

    for i in range(
        0,
        len(text),
        chunk_size
    ):
        chunks.append(
            text[i:i + chunk_size]
        )

    return chunks


def create_embedding(
    text: str
):
    embedding = model.encode(
        text
    )

    return embedding.tolist()


def embedding_to_string(
    embedding
):
    return json.dumps(
        embedding
    )