from datetime import UTC, datetime

from fastapi import APIRouter

from backend.database.connection import database
from backend.schemas.mri import MRIResultCreate, MRIResultResponse

router = APIRouter(prefix="/api/mri", tags=["MRI"])


def _prediction_from_result(payload: MRIResultCreate) -> str:
    if payload.lesion_count >= 4 or payload.lesion_volume_ml >= 1.5:
        return "ms"
    if payload.lesion_count >= 1:
        return "cis"
    return "ris"


@router.post("/results", response_model=MRIResultResponse)
def save_mri_result(payload: MRIResultCreate):
    now = datetime.now(UTC)
    document = {"patient_id": payload.patient_id, **payload.model_dump(), "updated_at": now.isoformat()}
    db = database.require_db()
    db.mri_results.replace_one({"patient_id": payload.patient_id}, document, upsert=True)
    visit_number = db.mri_visits.count_documents({"patient_id": payload.patient_id}) + 1
    db.mri_visits.insert_one(
        {
            "patient_id": payload.patient_id,
            "visitNumber": visit_number,
            "scanDate": now.date().isoformat(),
            "lesionCount": payload.lesion_count,
            "lesionVolumeML": payload.lesion_volume_ml,
            "newLesions": None,
            "enlargingLesions": None,
            "cognitiveScore": None,
            "clinicianNote": "MRI lesion segmentation completed from persisted model output.",
            "source": "mri_results",
            "created_at": now,
        }
    )
    db.patients.update_one(
        {"patient_id": payload.patient_id},
        {"$set": {"mri_status": "analyzed", "last_visit": now, "prediction_status": _prediction_from_result(payload)}},
    )
    db.audit_events.insert_one({"id": f"mri-{payload.patient_id}-{now.timestamp()}", "patient_id": payload.patient_id, "timestamp": now, "actor": "ai_model", "description": f"MRI lesion segmentation completed with {payload.lesion_count} model-detected lesion regions."})
    return MRIResultResponse(**document)


@router.get("/results/{patient_id}", response_model=MRIResultResponse)
def get_mri_result(patient_id: str):
    document = database.require_db().mri_results.find_one({"patient_id": patient_id})
    if not document:
        from fastapi import HTTPException
        raise HTTPException(404, "MRI result not found")
    return MRIResultResponse(**document)
