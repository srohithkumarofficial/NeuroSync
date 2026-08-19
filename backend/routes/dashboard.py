from fastapi import APIRouter, HTTPException

from backend.database.connection import database
from backend.schemas.common import DashboardResponse, UserResponse
from backend.services.adaptive_service import recommend_difficulty
from backend.services.cognitive_service import get_progress, list_exercises

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/{user_id}", response_model=DashboardResponse, summary="Get main cognitive-training dashboard data")
def dashboard(user_id: str):
    db = database.require_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    progress = get_progress(user_id)
    difficulty, _ = recommend_difficulty(progress.cognitive_score if progress.total_attempts else None, user.get("preferences", {}).get("difficulty"))
    exercises = list_exercises(None, difficulty)
    attempts = db.attempts.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    return DashboardResponse(user=UserResponse(**user, id=user["_id"]), cognitive_score=progress.cognitive_score, completed_exercises=progress.total_attempts, recent_activity=[{"exercise_id": item["exercise_id"], "score": item["score"], "date": item["created_at"].isoformat()} for item in attempts], recommended_exercise=exercises[0] if exercises else None)
