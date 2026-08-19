from datetime import UTC, datetime

from fastapi import APIRouter

from backend.database.connection import database
from backend.schemas.mri import MRIResultCreate, MRIResultResponse

router = APIRouter(prefix="/api/mri", tags=["MRI"])


@router.post("/results", response_model=MRIResultResponse)
def save_mri_result(payload: MRIResultCreate):
    now = datetime.now(UTC)
    document = {"patient_id": payload.patient_id, **payload.model_dump(), "updated_at": now.isoformat()}
    database.require_db().mri_results.replace_one({"patient_id": payload.patient_id}, document, upsert=True)
    database.require_db().patients.update_one(
    {"patient_id": payload.patient_id},
    {
        "$set": {
            "mri_status": "analyzed",
            "last_visit": now,
            "prediction_status": "not_available"
        }
    }
)
    database.require_db().audit_events.insert_one({"id": f"mri-{payload.patient_id}-{now.timestamp()}", "patient_id": payload.patient_id, "timestamp": now, "actor": "ai_model", "description": f"MRI lesion segmentation completed with {payload.lesion_count} model-detected lesion regions."})
    return MRIResultResponse(**document)


@router.get("/results/{patient_id}", response_model=MRIResultResponse)
def get_mri_result(patient_id: str):
    document = database.require_db().mri_results.find_one({"patient_id": patient_id})
    if not document:
        from fastapi import HTTPException
        raise HTTPException(404, "MRI result not found")
    return MRIResultResponse(**document)
