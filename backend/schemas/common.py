from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Domain = Literal["attention", "processing_speed", "memory", "cognitive_flexibility"]
Difficulty = Literal["easy", "medium", "hard"]


class APIModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class UserCreate(APIModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    preferences: dict = Field(default_factory=dict)


class UserResponse(UserCreate):
    id: str
    created_at: datetime


class LoginRequest(APIModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class ClinicianResponse(APIModel):
    id: str
    name: str
    role: Literal["Neurologist", "Radiologist", "Clinician", "Staff"]
    hospital: str


class ExerciseResponse(APIModel):
    id: str
    domain: Domain
    name: str
    instructions: str
    durationSeconds: int = Field(ge=1)
    difficulty: Difficulty
    type: str
    category: str
    question: str | None = None
    options: list[str] = Field(default_factory=list)


class AnswerSubmission(APIModel):
    user_id: str = Field(min_length=1, max_length=80)
    exercise_id: str = Field(min_length=1, max_length=80)
    answer: str | list[str] | int | float
    response_time: float = Field(ge=0, le=3600)


class AnswerResult(APIModel):
    exercise_id: str
    correct: bool
    score: float = Field(ge=0, le=100)
    response_time: float
    feedback: str


class CognitiveResult(APIModel):
    exerciseId: str
    domain: Domain
    score: float = Field(ge=0, le=100)
    avgReactionTimeMs: float = Field(ge=0, le=120000)
    accuracyPct: float = Field(ge=0, le=100)
    completed: bool
    exerciseType: str | None = None
    metrics: dict[str, float | int | str | None] = Field(default_factory=dict)


class CognitiveSessionCreate(APIModel):
    patient_id: str = Field(min_length=1, max_length=80)
    results: list[CognitiveResult] = Field(min_length=1, max_length=20)


class CognitiveSessionResponse(APIModel):
    id: str
    patientId: str
    date: datetime
    domainScores: dict[Domain, float]
    results: list[CognitiveResult]


class ProgressPoint(APIModel):
    date: str
    score: float


class ProgressResponse(APIModel):
    user_id: str
    cognitive_score: float
    total_attempts: int
    correct_attempts: int
    average_response_time: float
    category_scores: dict[str, float]
    recent_performance: list[ProgressPoint]
    updated_at: datetime | None = None


class RecommendationResponse(APIModel):
    exercise: ExerciseResponse
    reason: str


class DashboardResponse(APIModel):
    user: UserResponse
    cognitive_score: float
    completed_exercises: int
    recent_activity: list[dict]
    recommended_exercise: ExerciseResponse | None


class SessionStart(APIModel):
    user_id: str = Field(min_length=1, max_length=80)


class SessionResponse(APIModel):
    id: str
    user_id: str
    started_at: datetime
    ended_at: datetime | None = None
    exercises_completed: int = 0
    average_score: float | None = None
