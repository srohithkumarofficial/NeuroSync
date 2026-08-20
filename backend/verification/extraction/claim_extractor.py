import re

from backend.verification.schemas.models import Claim, ClaimType

CLAUSE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\s*,?\s+(?:and|with|while|but|proving|indicating|therefore|which)\s+", re.IGNORECASE)
NUMBER_RE = re.compile(r"\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\b", re.IGNORECASE)


def _classify_claim(text: str) -> ClaimType:
    lower = text.lower()
    if NUMBER_RE.search(lower) and any(term in lower for term in ("lesion", "voxel", "volume", "ml", "dimension", "shape", "mask")):
        return "numerical_medical_result"
    if any(term in lower for term in ("definitely has", "diagnosed with", "diagnosis", "multiple sclerosis", " ms", "has ms")):
        return "diagnostic_claim"
    if any(term in lower for term in ("treat", "therapy", "medication", "dose", "prescribe", "stop taking", "start taking")):
        return "treatment_claim"
    if any(term in lower for term in ("suggest", "compatible", "consistent", "supports", "pattern")):
        return "descriptive_interpretation"
    return "general"


def extract_claims(response: str) -> list[Claim]:
    raw_parts = [part.strip(" .;:\n\t") for part in CLAUSE_SPLIT_RE.split(response) if part.strip(" .;:\n\t")]
    claims: list[Claim] = []
    for index, part in enumerate(raw_parts, start=1):
        claim_type = _classify_claim(part)
        if claim_type == "general":
            continue
        claims.append(Claim(id=f"claim_{len(claims) + 1}", text=part, type=claim_type))
    return claims
