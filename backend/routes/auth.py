from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from backend.database.connection import database
from backend.schemas.common import ClinicianResponse, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=ClinicianResponse, summary="Start a prototype clinician session")
def login(payload: LoginRequest):
    """Prototype-only login restricted to the seeded clinician account."""
    email = payload.email.lower().strip()
    if email != "arjunraj@gmail.com" or payload.password != "arjunraj":
        raise HTTPException(status_code=401, detail="Invalid email or password")
    clinician = {"_id": "clin-001", "name": "Dr. Arjun Raj", "role": "Neurologist", "hospital": "NeuroSync Clinical Center"}
    database.require_db().users.update_one(
        {"_id": clinician["_id"]},
        {"$set": {**clinician, "email": email, "password": "arjunraj"}, "$setOnInsert": {"preferences": {}, "created_at": datetime.now(UTC)}},
        upsert=True,
    )
    return ClinicianResponse(id=clinician["_id"], name=clinician["name"], role=clinician["role"], hospital=clinician["hospital"])
