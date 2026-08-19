from fastapi import APIRouter, HTTPException, Query

from backend.database.connection import database
from backend.schemas.common import ExerciseResponse, RecommendationResponse
from backend.services.adaptive_service import recommend_difficulty
from backend.services.cognitive_service import get_exercise, get_progress, list_exercises

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=list[ExerciseResponse], summary="List active cognitive exercises")
def exercises(domain: str | None = Query(None), difficulty: str | None = Query(None)):
    return list_exercises(domain, difficulty)


@router.get("/recommended/{user_id}", response_model=RecommendationResponse, summary="Get an adaptive exercise recommendation")
def recommended(user_id: str):
    db = database.require_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    progress = get_progress(user_id)
    difficulty, reason = recommend_difficulty(progress.cognitive_score if progress.total_attempts else None, user.get("preferences", {}).get("difficulty"))
    matches = list_exercises(None, difficulty)
    if not matches:
        raise HTTPException(404, "No recommended exercise is available")
    return RecommendationResponse(exercise=matches[0], reason=reason)


@router.get("/{exercise_id}", response_model=ExerciseResponse, summary="Get one cognitive exercise")
def exercise(exercise_id: str):
    item = get_exercise(exercise_id)
    if not item:
        raise HTTPException(404, "Exercise not found")
    return item
