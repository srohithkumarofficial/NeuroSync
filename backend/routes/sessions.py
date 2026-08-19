from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from backend.database.connection import database
from backend.schemas.common import SessionResponse, SessionStart

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.post("", response_model=SessionResponse, summary="Start a cognitive-practice session")
def start_session(payload: SessionStart):
    if not database.require_db().users.find_one({"_id": payload.user_id}):
        raise HTTPException(404, "User not found")
    document = {"_id": f"session-{uuid4().hex}", "user_id": payload.user_id, "started_at": datetime.now(UTC), "ended_at": None, "exercises_completed": 0, "average_score": None}
    database.require_db().sessions.insert_one(document)
    return SessionResponse(**document, id=document["_id"])


@router.post("/{session_id}/complete", response_model=SessionResponse, summary="Complete a cognitive-practice session")
def complete_session(session_id: str):
    db = database.require_db()
    session = db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(404, "Session not found")
    attempts = list(db.attempts.find({"user_id": session["user_id"], "created_at": {"$gte": session["started_at"]}}))
    update = {"ended_at": datetime.now(UTC), "exercises_completed": len(attempts), "average_score": round(sum(item["score"] for item in attempts) / len(attempts), 2) if attempts else 0}
    db.sessions.update_one({"_id": session_id}, {"$set": update})
    return SessionResponse(**session, **update, id=session["_id"])
