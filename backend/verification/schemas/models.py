from typing import Literal

from pydantic import BaseModel, Field

ClaimType = Literal["numerical_medical_result", "diagnostic_claim", "treatment_claim", "descriptive_interpretation", "general"]
VerificationStatus = Literal["SUPPORTED", "CONTRADICTED", "UNSUPPORTED"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]
FirewallAction = Literal["PASS", "REWRITE", "BLOCK"]
NliLabel = Literal["ENTAILMENT", "CONTRADICTION", "UNKNOWN"]


class RetrievedEvidence(BaseModel):
    id: str
    source: str
    text: str
    score: float = Field(ge=0, le=1)


class EvidenceBundle(BaseModel):
    lesion_count: int | None = None
    lesion_volume_ml: float | None = None
    lesion_voxels: int | None = None
    shape: list[int] = Field(default_factory=list)
    modalities: list[str] = Field(default_factory=list)
    text_evidence: list[str] = Field(default_factory=list)
    trusted_documents: list[str] = Field(default_factory=list)


class VerificationRequest(BaseModel):
    response: str = Field(min_length=1, max_length=12000)
    evidence: EvidenceBundle = Field(default_factory=EvidenceBundle)


class Claim(BaseModel):
    id: str
    text: str
    type: ClaimType


class VerifiedClaim(Claim):
    status: VerificationStatus
    risk: RiskLevel
    confidence: float = Field(ge=0, le=1)
    reason: str
    evidence: list[str] = Field(default_factory=list)
    retrieved_evidence: list[RetrievedEvidence] = Field(default_factory=list)
    nli_label: NliLabel | None = None


class VerificationResponse(BaseModel):
    verified: bool
    action: FirewallAction
    overall_confidence: float = Field(ge=0, le=1)
    risk_level: RiskLevel
    claims: list[VerifiedClaim]
    rewritten_response: str | None = None
