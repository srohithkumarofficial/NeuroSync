from datetime import UTC, date, datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from backend.database.connection import database
from backend.schemas.patients import PatientCreate, PatientResponse

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _response(document: dict) -> PatientResponse:
    last_visit = document.get("last_visit")

    # MongoDB stores timestamps as datetime.
    # PatientResponse expects a date.
    if isinstance(last_visit, datetime):
        last_visit = last_visit.date()

    return PatientResponse(
        id=document["patient_id"],
        age=_age(document["date_of_birth"]),
        last_visit=last_visit,
        **{
            key: document[key]
            for key in (
                "name",
                "date_of_birth",
                "sex",
                "assigned_clinician",
                "mri_status",
                "prediction_status",
                "cognitive_status",
                "last_report_status",
                "flags",
            )
        }
    )


@router.get("", response_model=list[PatientResponse])
def list_patients():
    return [_response(document) for document in database.require_db().patients.find().sort("created_at", -1)]


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate):
    patient_id = f"NS-{10000 + database.require_db().patients.count_documents({}) + 1}"
    document = {
    "patient_id": patient_id,
    **payload.model_dump(),
    "date_of_birth": datetime.combine(
        payload.date_of_birth,
        datetime.min.time(),
        tzinfo=UTC,
    ),
    "last_visit": None,
    "mri_status": "not_started",
    "prediction_status": "not_available",
    "cognitive_status": "not_started",
    "last_report_status": "none",
    "flags": [],
    "created_at": datetime.now(UTC),
}
    database.require_db().patients.insert_one(document)
    database.require_db().audit_events.insert_one({"id": f"patient-{patient_id}", "patient_id": patient_id, "timestamp": document["created_at"], "actor": "clinician", "description": "Patient record created."})
    return _response(document)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str):
    document = database.require_db().patients.find_one({"patient_id": patient_id})
    if not document:
        raise HTTPException(404, "Patient not found")
    return _response(document)
