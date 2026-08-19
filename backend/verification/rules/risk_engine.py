from backend.verification.schemas.models import Claim, RiskLevel

VERY_HIGH_TERMS = (
    "emergency",
    "immediately stop",
    "immediately start",
    "change treatment",
    "definitively rules out",
)
HIGH_TERMS = (
    "definitely has",
    "proves",
    "diagnosed with",
    "has multiple sclerosis",
    "has ms",
    "treatment",
    "medication",
    "prescribe",
    "prognosis",
)
MEDIUM_TERMS = ("suggest", "compatible", "consistent", "likely", "supports", "clinical")


def classify_risk(claim: Claim) -> tuple[RiskLevel, str]:
    lower = claim.text.lower()
    if claim.type == "treatment_claim" or any(term in lower for term in VERY_HIGH_TERMS):
        return "VERY_HIGH", "Treatment, emergency, or definitive safety-sensitive claim."
    if claim.type == "diagnostic_claim" or any(term in lower for term in HIGH_TERMS):
        return "HIGH", "Diagnostic certainty requires clinical evidence beyond model findings."
    if claim.type == "numerical_medical_result":
        return "LOW", "Structured numerical model finding."
    if claim.type == "descriptive_interpretation" or any(term in lower for term in MEDIUM_TERMS):
        return "MEDIUM", "Interpretive medical language requires supporting evidence."
    return "LOW", "Low-risk factual or general statement."
