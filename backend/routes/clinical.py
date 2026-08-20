from fastapi import APIRouter, HTTPException

from backend.database.connection import database

router = APIRouter(tags=["Clinical Data"])


@router.get("/api/evidence/{patient_id}")
def evidence(patient_id: str):
    db = database.require_db()
    mri = db.mri_results.find_one({"patient_id": patient_id})
    if not mri:
        return []
    items = [{"id": f"mri-{patient_id}-count", "category": "mri", "statement": f"The MRI model identified {mri['lesion_count']} lesion regions."}, {"id": f"mri-{patient_id}-volume", "category": "mri", "statement": f"The MRI model measured a total lesion volume of {mri['lesion_volume_ml']} mL."}, {"id": f"mri-{patient_id}-voxels", "category": "mri", "statement": f"The segmentation mask contains {mri['lesion_voxels']} lesion voxels."}]
    return items


@router.get("/api/evidence/{scan_id}/claims")
def evidence_claims(scan_id: str):
    report = database.require_db().reports.find_one({"$or": [{"scan_id": scan_id}, {"patient_id": scan_id}]}, sort=[("created_at", -1)])
    if not report:
        return []
    status_map = {"SUPPORTED": "verified", "UNSUPPORTED": "unsupported", "CONTRADICTED": "blocked", "REQUIRES_REVIEW": "requires_review"}
    return [{"id": claim.get("id", f"claim-{index}"), "statement": claim.get("text", ""), "evidenceSource": "; ".join(claim.get("evidence", [])) or claim.get("reason", "Verification firewall"), "status": status_map.get(claim.get("status", "UNSUPPORTED"), "unsupported")} for index, claim in enumerate(report.get("verification_claims", []), 1)]


@router.post("/api/llm/explanation")
def llm_explanation(payload: dict):
    scan_id = payload.get("scan_id")
    report = database.require_db().reports.find_one({"$or": [{"scan_id": scan_id}, {"patient_id": scan_id}]}, sort=[("created_at", -1)])
    if not report:
        raise HTTPException(404, "No Sarvam-generated report is available for this scan")
    return {"id": report["_id"], "scanId": payload["scan_id"], "summary": report["report"], "generatedAt": report["created_at"].isoformat(), "sourceEvidenceIds": [claim.get("id", "") for claim in report.get("verification_claims", [])], "status": "generated"}


@router.get("/api/audit/{patient_id}")
def audit(patient_id: str):
    return list(database.require_db().audit_events.find({"patient_id": patient_id}, {"_id": 0}).sort("timestamp", -1))


@router.get("/api/notifications")
def notifications():
    db = database.require_db()
    rows = []
    for patient in db.patients.find({"mri_status": {"$in": ["analyzed", "requires_review"]}}).sort("last_visit", -1).limit(20):
        rows.append({"id": f"mri-ready-{patient['patient_id']}", "patientId": patient["patient_id"], "type": "mri_ready", "message": f"MRI analysis available for {patient['name']}", "timestamp": patient.get("last_visit"), "read": False})
    for report in db.reports.find({"status": {"$in": ["ai_draft", "clinician_review", "clinician_edited"]}}).sort("created_at", -1).limit(20):
        rows.append({"id": f"report-approval-{report['_id']}", "patientId": report["patient_id"], "type": "report_approval", "message": f"Report awaiting approval for {report['patient_id']}", "timestamp": report.get("created_at"), "read": False})
    for session in db.sessions.find({"patientId": {"$exists": True}}).sort("date", -1).limit(20):
        rows.append({"id": f"cognitive-complete-{session['_id']}", "patientId": session["patientId"], "type": "cognitive_complete", "message": f"Cognitive assessment completed for {session['patientId']}", "timestamp": session.get("date"), "read": False})
    rows.sort(key=lambda item: item.get("timestamp").isoformat() if hasattr(item.get("timestamp"), "isoformat") else str(item.get("timestamp") or ""), reverse=True)
    return rows


@router.get("/api/patients/{patient_id}/timeline")
def timeline(patient_id: str):
    return list(database.require_db().mri_visits.find({"patient_id": patient_id}, {"_id": 0}).sort("scanDate", 1))
