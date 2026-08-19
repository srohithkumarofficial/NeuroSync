from datetime import UTC, datetime

from fastapi import APIRouter

from backend.database.connection import database
from backend.schemas.common import ClinicianResponse, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=ClinicianResponse, summary="Start a prototype clinician session")
def login(payload: LoginRequest):
    """Prototype-only login. Replace with institutional SSO/OIDC for production."""
    clinician = {"_id": "clin-001", "name": "Dr. Elena Cho", "role": "Neurologist", "hospital": "Ashworth Neurology & MS Center"}
    database.require_db().users.update_one(
        {"_id": clinician["_id"]},
        {"$setOnInsert": {**clinician, "email": payload.email.lower(), "preferences": {}, "created_at": datetime.now(UTC)}},
        upsert=True,
    )
    return ClinicianResponse(id=clinician["_id"], name=clinician["name"], role=clinician["role"], hospital=clinician["hospital"])
