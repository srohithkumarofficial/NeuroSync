from fastapi import APIRouter, HTTPException

from backend.schemas.common import ProgressResponse
from backend.services.cognitive_service import get_progress

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("/{user_id}", response_model=ProgressResponse, summary="Get cognitive practice progress")
def progress(user_id: str):
    try:
        return get_progress(user_id)
    except LookupError as error:
        raise HTTPException(404, str(error)) from error
