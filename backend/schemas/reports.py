from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    patient_id: str = Field(min_length=1, max_length=80)
    clinician_id: str = "clin-001"


class ReportEditRequest(BaseModel):
    report: str = Field(min_length=1, max_length=20000)
    clinician_id: str = "clin-001"


class ReportApproveRequest(BaseModel):
    clinician_id: str = "clin-001"
    clinician_name: str = Field(min_length=1, max_length=120)


class ReportResponse(BaseModel):
    id: str
    patient_id: str
    scan_id: str
    status: Literal["ai_draft", "clinician_review", "clinician_edited", "approved"]
    created_at: datetime
    findings: str
    impression: str
    report: str
    doctor_edit: str | None = None
    approved_by: str | None = None
    approved_at: datetime | None = None
    verification_action: Literal["PASS", "REWRITE", "BLOCK"]
    verification_risk: Literal["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]
    verification_claims: list[dict] = Field(default_factory=list)
    versions: list[dict] = Field(default_factory=list)
