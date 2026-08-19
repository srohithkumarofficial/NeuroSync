import re

from backend.verification.rag.knowledge_base import KnowledgeBase
from backend.verification.schemas.models import RetrievedEvidence

STOPWORDS = {"the", "a", "an", "and", "or", "of", "to", "with", "by", "is", "are", "was", "were", "that", "this"}


def _tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-zA-Z0-9.]+", text.lower()) if token not in STOPWORDS}


class TrustedEvidenceRetriever:
    def __init__(self, knowledge_base: KnowledgeBase | None = None) -> None:
        self.knowledge_base = knowledge_base or KnowledgeBase()

    def retrieve(self, claim: str, inline_documents: list[str] | None = None, limit: int = 3) -> list[RetrievedEvidence]:
        claim_tokens = _tokens(claim)
        candidates: list[RetrievedEvidence] = []
        for source, document in self.knowledge_base.load_documents(inline_documents):
            chunks = [chunk.strip() for chunk in re.split(r"\n\s*\n|(?<=[.!?])\s+", document) if chunk.strip()]
            for index, chunk in enumerate(chunks, start=1):
                chunk_tokens = _tokens(chunk)
                score = len(claim_tokens & chunk_tokens) / max(1, len(claim_tokens))
                if score > 0:
                    candidates.append(RetrievedEvidence(id=f"{source}:{index}", source=source, text=chunk, score=round(min(score, 1.0), 3)))
        return sorted(candidates, key=lambda item: item.score, reverse=True)[:limit]
