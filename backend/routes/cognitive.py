from fastapi import APIRouter, HTTPException

from backend.schemas.common import AnswerResult, AnswerSubmission, CognitiveSessionCreate, CognitiveSessionResponse
from backend.services.cognitive_service import history, submit_answer, submit_session

router = APIRouter(prefix="/api/cognitive", tags=["Cognitive"])


@router.post("/submit", response_model=AnswerResult, summary="Evaluate and record an objective exercise answer")
def submit(payload: AnswerSubmission):
    try:
        return submit_answer(payload)
    except LookupError as error:
        raise HTTPException(404, str(error)) from error


@router.post("/session", response_model=CognitiveSessionResponse, summary="Store a completed supervised cognitive session")
def create_session(payload: CognitiveSessionCreate):
    return submit_session(payload)


@router.get("/{patient_id}/history", response_model=list[CognitiveSessionResponse], summary="List supervised cognitive-session history")
def session_history(patient_id: str):
    return history(patient_id)
