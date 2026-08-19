from backend.verification.rewriting.rewriter import rewrite_response
from backend.verification.schemas.models import EvidenceBundle, VerificationResponse, VerifiedClaim

RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "VERY_HIGH": 3}


def decide(claims: list[VerifiedClaim], evidence: EvidenceBundle) -> VerificationResponse:
    if not claims:
        return VerificationResponse(verified=False, action="BLOCK", overall_confidence=0.5, risk_level="HIGH", claims=[], rewritten_response=None)

    risk_level = max((claim.risk for claim in claims), key=lambda risk: RISK_ORDER[risk])
    all_supported = all(claim.status == "SUPPORTED" for claim in claims)
    any_contradicted = any(claim.status == "CONTRADICTED" for claim in claims)
    any_unsupported_high = any(claim.status == "UNSUPPORTED" and claim.risk in ("HIGH", "VERY_HIGH") for claim in claims)
    overall_confidence = round(sum(claim.confidence for claim in claims) / len(claims), 2)

    if all_supported:
        return VerificationResponse(verified=True, action="PASS", overall_confidence=overall_confidence, risk_level=risk_level, claims=claims)
    if any_contradicted and risk_level == "VERY_HIGH":
        return VerificationResponse(verified=False, action="BLOCK", overall_confidence=overall_confidence, risk_level=risk_level, claims=claims)
    rewritten = rewrite_response(claims, evidence)
    action = "REWRITE" if any_unsupported_high or any_contradicted else "REWRITE"
    return VerificationResponse(verified=False, action=action, overall_confidence=overall_confidence, risk_level=risk_level, claims=claims, rewritten_response=rewritten)
