from fastapi import APIRouter

from backend.verification.schemas.models import VerificationRequest, VerificationResponse
from backend.verification.service import VerificationFirewall

router = APIRouter(tags=["Verification Firewall"])
firewall = VerificationFirewall()


@router.get("/verify", summary="Verification firewall status")
def status():
    return {"status": "ready", "service": "NeuroSync Verification Firewall", "phases": ["claims", "rules", "nli", "rag", "rewrite"]}


@router.post("/verify", response_model=VerificationResponse, summary="Verify an AI-generated response against evidence")
def verify(payload: VerificationRequest):
    return firewall.verify(payload)
