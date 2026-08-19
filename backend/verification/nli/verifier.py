import re

from backend.verification.schemas.models import NliLabel

STOPWORDS = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "that",
    "this",
    "patient",
}
NUMBER_WORDS = {
    "zero": "0",
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "ten": "10",
}


def _tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-zA-Z0-9.]+", text.lower()) if token not in STOPWORDS}


def _numbers(text: str) -> list[str]:
    numeric = re.findall(r"\b\d+(?:\.\d+)?\b", text)
    words = [NUMBER_WORDS[token] for token in re.findall(r"[a-zA-Z]+", text.lower()) if token in NUMBER_WORDS]
    return numeric + words


def classify_nli(claim: str, evidence_texts: list[str]) -> tuple[NliLabel, float, str]:
    if not evidence_texts:
        return "UNKNOWN", 0.55, "No textual evidence available for NLI comparison."

    claim_tokens = _tokens(claim)
    claim_numbers = _numbers(claim)
    best_overlap = 0.0
    number_conflict = False

    for evidence in evidence_texts:
        evidence_tokens = _tokens(evidence)
        overlap = len(claim_tokens & evidence_tokens) / max(1, len(claim_tokens))
        best_overlap = max(best_overlap, overlap)
        evidence_numbers = _numbers(evidence)
        if claim_numbers and evidence_numbers and any(num not in evidence_numbers for num in claim_numbers) and len(claim_tokens & evidence_tokens) >= 2:
            number_conflict = True

    if number_conflict:
        return "CONTRADICTION", 0.82, "Claim and evidence discuss similar terms but contain conflicting numbers."
    if best_overlap >= 0.62:
        return "ENTAILMENT", min(0.9, 0.62 + best_overlap / 3), "Claim is substantially entailed by trusted textual evidence."
    return "UNKNOWN", max(0.55, best_overlap), "Trusted evidence does not entail the claim."
