from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from backend.config.settings import get_settings
from backend.database.connection import database
from backend.schemas.common import ClinicianResponse, LoginRequest
from backend.security.passwords import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=ClinicianResponse, summary="Start a prototype clinician session")
def login(payload: LoginRequest):
    """Authenticate against the configured clinician credentials without storing plaintext passwords."""
    settings = get_settings()
    email = payload.email.lower().strip()
    expected_email = settings.default_clinician_email.lower().strip()
    expected_password = settings.default_clinician_password

    if not expected_email or not expected_password:
        raise HTTPException(
            status_code=503,
            detail="Default clinician credentials are not configured. Set DEFAULT_CLINICIAN_EMAIL and DEFAULT_CLINICIAN_PASSWORD in backend/.env.",
        )

    db = database.require_db()
    clinician = {"_id": "clin-001", "name": "Dr. Arjun Raj", "role": "Neurologist", "hospital": "NeuroSync Clinical Center"}
    stored_user = db.users.find_one({"_id": clinician["_id"]})
    stored_password = (stored_user or {}).get("password")

    if email != expected_email or not verify_password(payload.password, stored_password or hash_password(expected_password)):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_hash = hash_password(expected_password)
    db.users.update_one(
        {"_id": clinician["_id"]},
        {
            "$set": {**clinician, "email": expected_email, "password": password_hash, "updated_at": datetime.now(UTC)},
            "$setOnInsert": {"preferences": {}, "created_at": datetime.now(UTC)},
        },
        upsert=True,
    )
    return ClinicianResponse(id=clinician["_id"], name=clinician["name"], role=clinician["role"], hospital=clinician["hospital"])
