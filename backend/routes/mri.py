from datetime import UTC, datetime

from fastapi import APIRouter

from backend.database.connection import database
from backend.schemas.mri import MRIResultCreate, MRIResultResponse
from backend.services.prediction_metrics import estimated_edss_from_mri, mri_progression_from_visits, prediction_label_from_mri

router = APIRouter(prefix="/api/mri", tags=["MRI"])


def _response(document: dict, progression: dict | None = None) -> MRIResultResponse:
    edss = estimated_edss_from_mri(document, progression)
    payload = dict(document)
    if edss:
        payload.update({"edss_score": edss["score"], "edss_band": edss["band"], "edss_note": edss["note"]})
    return MRIResultResponse(**payload)


@router.post("/results", response_model=MRIResultResponse)
def save_mri_result(payload: MRIResultCreate):
    now = datetime.now(UTC)
    document = {"patient_id": payload.patient_id, **payload.model_dump(), "updated_at": now.isoformat()}
    db = database.require_db()
    db.mri_results.replace_one({"patient_id": payload.patient_id}, document, upsert=True)
    visit_number = db.mri_visits.count_documents({"patient_id": payload.patient_id}) + 1
    previous_visit = db.mri_visits.find_one({"patient_id": payload.patient_id}, {"_id": 0}, sort=[("scanDate", -1)])
    latest_visit = {"lesionCount": payload.lesion_count, "lesionVolumeML": payload.lesion_volume_ml}
    progression = mri_progression_from_visits([latest_visit, previous_visit] if previous_visit else [latest_visit])
    db.mri_visits.insert_one(
        {
            "patient_id": payload.patient_id,
            "visitNumber": visit_number,
            "scanDate": now.date().isoformat(),
            "lesionCount": payload.lesion_count,
            "lesionVolumeML": payload.lesion_volume_ml,
            "newLesions": progression["count_increase"],
            "enlargingLesions": None,
            "volumeChangeML": round(progression["volume_increase_ml"], 4),
            "volumeChangePct": round(progression["volume_increase_pct"], 2),
            "cognitiveScore": None,
            "clinicianNote": "MRI lesion segmentation completed from persisted model output.",
            "source": "mri_results",
            "created_at": now,
        }
    )
    db.patients.update_one(
        {"patient_id": payload.patient_id},
        {"$set": {"mri_status": "analyzed", "last_visit": now, "prediction_status": prediction_label_from_mri(payload.model_dump(), progression)}},
    )
    db.audit_events.insert_one({"id": f"mri-{payload.patient_id}-{now.timestamp()}", "patient_id": payload.patient_id, "timestamp": now, "actor": "ai_model", "description": f"MRI lesion segmentation completed with {payload.lesion_count} model-detected lesion regions."})
    return _response(document, progression)


@router.get("/results/{patient_id}", response_model=MRIResultResponse)
def get_mri_result(patient_id: str):
    db = database.require_db()
    document = db.mri_results.find_one({"patient_id": patient_id})
    if not document:
        from fastapi import HTTPException
        raise HTTPException(404, "MRI result not found")
    visits = list(db.mri_visits.find({"patient_id": patient_id}, {"_id": 0}).sort("scanDate", -1).limit(2))
    progression = mri_progression_from_visits(visits)
    return _response(document, progression)
