from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from backend.database.connection import database
from backend.schemas.common import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a prototype user")
def create_user(payload: UserCreate):
    document = {"_id": f"usr-{uuid4().hex}", **payload.model_dump(), "email": payload.email.lower(), "created_at": datetime.now(UTC)}
    try:
        database.require_db().users.insert_one(document)
    except DuplicateKeyError as error:
        raise HTTPException(409, "A user with this email already exists") from error
    return UserResponse(**document, id=document["_id"])


@router.get("/{user_id}", response_model=UserResponse, summary="Get a user")
def get_user(user_id: str):
    user = database.require_db().users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    return UserResponse(**user, id=user["_id"])
