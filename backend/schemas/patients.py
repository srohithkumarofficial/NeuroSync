from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    date_of_birth: date
    sex: Literal["female", "male", "other"]
    assigned_clinician: str = Field(default="Dr. Elena Cho", min_length=1, max_length=120)


class PatientResponse(PatientCreate):
    id: str
    age: int
    last_visit: date | None = None
    mri_status: Literal["not_started", "pending_review", "analyzed", "requires_review"] = "not_started"
    prediction_status: str = "not_available"
    prediction_score: int | None = None
    cognitive_status: Literal["not_started", "scheduled", "completed"] = "not_started"
    last_report_status: Literal["none", "draft", "awaiting_approval", "approved"] = "none"
    flags: list[str] = Field(default_factory=list)
