import logging

from backend.verification.decision.decision_engine import decide
from backend.verification.extraction.claim_extractor import extract_claims
from backend.verification.nli.verifier import classify_nli
from backend.verification.rag.retriever import TrustedEvidenceRetriever
from backend.verification.rules.fact_checker import check_structured_fact
from backend.verification.rules.risk_engine import classify_risk
from backend.verification.schemas.models import VerificationRequest, VerificationResponse, VerifiedClaim

logger = logging.getLogger("neurosync.verification")


class VerificationFirewall:
    def __init__(self, retriever: TrustedEvidenceRetriever | None = None) -> None:
        self.retriever = retriever or TrustedEvidenceRetriever()

    def verify(self, payload: VerificationRequest) -> VerificationResponse:
        extracted = extract_claims(payload.response)
        verified_claims: list[VerifiedClaim] = []
        logger.info("verification.claims_extracted count=%s", len(extracted))

        for claim in extracted:
            risk, risk_reason = classify_risk(claim)
            deterministic = check_structured_fact(claim, payload.evidence)
            retrieved = self.retriever.retrieve(claim.text, payload.evidence.trusted_documents)
            nli_label = None

            if deterministic:
                status, confidence, reason, evidence_sources = deterministic
            else:
                textual_evidence = payload.evidence.text_evidence + [item.text for item in retrieved]
                nli_label, nli_confidence, nli_reason = classify_nli(claim.text, textual_evidence)
                if nli_label == "ENTAILMENT":
                    status, confidence, reason, evidence_sources = "SUPPORTED", nli_confidence, nli_reason, ["trusted textual evidence"]
                elif nli_label == "CONTRADICTION":
                    status, confidence, reason, evidence_sources = "CONTRADICTED", nli_confidence, nli_reason, ["trusted textual evidence"]
                else:
                    status, confidence, reason, evidence_sources = "UNSUPPORTED", max(0.7, nli_confidence), nli_reason, []

            if claim.type == "diagnostic_claim" and status == "SUPPORTED" and not any("diagnosis" in item.lower() for item in payload.evidence.text_evidence):
                status = "UNSUPPORTED"
                confidence = max(confidence, 0.9)
                reason = "Available evidence does not establish a clinical diagnosis."
                evidence_sources = []

            verified = VerifiedClaim(
                **claim.model_dump(),
                status=status,
                risk=risk,
                confidence=round(confidence, 2),
                reason=f"{reason} {risk_reason}",
                evidence=evidence_sources,
                retrieved_evidence=retrieved,
                nli_label=nli_label,
            )
            logger.info("verification.claim_result id=%s status=%s risk=%s", verified.id, verified.status, verified.risk)
            verified_claims.append(verified)

        response = decide(verified_claims, payload.evidence)
        logger.info("verification.decision action=%s risk=%s verified=%s", response.action, response.risk_level, response.verified)
        return response
