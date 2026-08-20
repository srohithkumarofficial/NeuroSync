from datetime import UTC, datetime
from difflib import ndiff
from uuid import uuid4

from backend.database.connection import database
from backend.schemas.reports import ReportEditRequest
from backend.services.sarvam_service import generate_report as generate_sarvam_report
from backend.verification.service import VerificationFirewall
from backend.verification.schemas.models import EvidenceBundle, VerificationRequest

firewall = VerificationFirewall()


def _serialize(document: dict) -> dict:
    return {
        "id": document["_id"], "patient_id": document["patient_id"], "scan_id": document["scan_id"],
        "status": document["status"], "created_at": document["created_at"], "findings": document["findings"],
        "impression": document["impression"], "report": document["report"], "doctor_edit": document.get("doctor_edit"),
        "approved_by": document.get("approved_by"), "approved_at": document.get("approved_at"),
        "verification_action": document["verification_action"], "verification_risk": document["verification_risk"],
        "verification_claims": document.get("verification_claims", []), "versions": document.get("versions", []),
    }


def _preferences(clinician_id: str) -> list[str]:
    docs = database.require_db().report_preferences.find({"clinician_id": clinician_id}).sort("updated_at", -1).limit(8)
    return [doc["guidance"] for doc in docs]


async def create_report(patient_id: str, clinician_id: str) -> dict:
    db = database.require_db()
    mri = db.mri_results.find_one({"patient_id": patient_id})
    if not mri:
        raise ValueError("No persisted MRI analysis is available for this patient. Run MRI analysis first.")
    patient = db.patients.find_one({"patient_id": patient_id})
    evidence = {
        "patientContext": {"patientId": patient_id, "name": patient.get("name"), "dateOfBirth": str(patient.get("date_of_birth")), "sex": patient.get("sex")} if patient else {"patientId": patient_id},
        "mriAnalysis": {"lesionCount": mri["lesion_count"], "lesionVolumeMl": mri["lesion_volume_ml"], "lesionVoxels": mri["lesion_voxels"], "shape": mri["shape"]},
        "clinicalEvidence": [], "longitudinalContext": [], "doctorPreferences": _preferences(clinician_id),
    }
    draft = await generate_sarvam_report(evidence, evidence["doctorPreferences"])
    combined = f"Findings:\n{draft['findings']}\n\nImpression:\n{draft['impression']}\n\n{draft['report']}"
    verification = firewall.verify(VerificationRequest(response=combined, evidence=EvidenceBundle(lesion_count=mri["lesion_count"], lesion_volume_ml=mri["lesion_volume_ml"], lesion_voxels=mri["lesion_voxels"], modalities=["T1", "FLAIR", "T2"])))
    if verification.action == "BLOCK":
        raise ValueError("The generated draft was blocked by the verification firewall and was not saved.")
    now = datetime.now(UTC)
    document = {"_id": f"rpt-{uuid4().hex}", "patient_id": patient_id, "scan_id": f"mri-{patient_id}", "status": "ai_draft", "created_at": now, **draft, "verification_action": verification.action, "verification_risk": verification.risk_level, "verification_claims": [claim.model_dump() for claim in verification.claims], "versions": [{"version": 1, "type": "ai_generated", "content": combined, "created_at": now}]}
    db.reports.insert_one(document)
    db.patients.update_one({"patient_id": patient_id}, {"$set": {"last_report_status": "draft", "last_visit": now}})
    db.audit_events.insert_one({"id": f"report-{patient_id}-{now.timestamp()}", "patient_id": patient_id, "timestamp": now, "actor": "llm", "description": f"AI-assisted report draft generated with verification action {verification.action}."})
    return _serialize(document)


def get_report(patient_id: str) -> dict | None:
    document = database.require_db().reports.find_one({"patient_id": patient_id}, sort=[("created_at", -1)])
    return _serialize(document) if document else None


def edit_report(report_id: str, payload: ReportEditRequest) -> dict:
    db = database.require_db()
    document = db.reports.find_one({"_id": report_id})
    if not document:
        raise ValueError("Report not found")
    now = datetime.now(UTC)
    db.reports.update_one({"_id": report_id}, {"$set": {"doctor_edit": payload.report, "report": payload.report, "status": "clinician_edited"}, "$push": {"versions": {"version": len(document.get("versions", [])) + 1, "type": "doctor_edited", "content": payload.report, "created_at": now}}})
    db.patients.update_one({"patient_id": document["patient_id"]}, {"$set": {"last_report_status": "draft", "last_visit": now}})
    db.audit_events.insert_one({"id": f"report-edit-{document['patient_id']}-{now.timestamp()}", "patient_id": document["patient_id"], "timestamp": now, "actor": "clinician", "description": "Clinician edited report draft."})
    original = document.get("doctor_edit") or document["report"]
    changes = " ".join(item[2:] for item in ndiff(original.split(), payload.report.split()) if item.startswith(("+ ", "- ")) and not any(character.isdigit() for character in item[2:]))
    guidance = f"Apply recurring clinician wording or structure preference only; never treat it as medical evidence: {changes[:1000]}"
    db.report_preferences.update_one({"clinician_id": payload.clinician_id, "guidance": guidance}, {"$set": {"updated_at": now}, "$setOnInsert": {"_id": f"pref-{uuid4().hex}", "clinician_id": payload.clinician_id, "guidance": guidance}}, upsert=True)
    return _serialize(db.reports.find_one({"_id": report_id}))


def approve_report(report_id: str, clinician_id: str, clinician_name: str) -> dict:
    db = database.require_db()
    document = db.reports.find_one({"_id": report_id})
    if not document:
        raise ValueError("Report not found")
    if document["verification_action"] == "BLOCK":
        raise ValueError("A blocked report cannot be approved.")
    now = datetime.now(UTC)
    db.reports.update_one({"_id": report_id}, {"$set": {"status": "approved", "approved_by": clinician_name, "approved_at": now}, "$push": {"versions": {"version": len(document.get("versions", [])) + 1, "type": "final_approved", "content": document.get("doctor_edit") or document["report"], "created_at": now, "clinician_id": clinician_id}}})
    db.patients.update_one({"patient_id": document["patient_id"]}, {"$set": {"last_report_status": "approved", "last_visit": now}})
    db.audit_events.insert_one({"id": f"report-approve-{document['patient_id']}-{now.timestamp()}", "patient_id": document["patient_id"], "timestamp": now, "actor": "clinician", "description": f"Report approved by {clinician_name}."})
    return _serialize(db.reports.find_one({"_id": report_id}))
