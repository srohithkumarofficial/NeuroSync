from collections import defaultdict
from datetime import UTC, datetime
from uuid import uuid4

from backend.database.connection import database
from backend.schemas.common import AnswerResult, AnswerSubmission, CognitiveResult, CognitiveSessionCreate, CognitiveSessionResponse, ExerciseResponse, ProgressResponse
from backend.services.safety_service import feedback_for_score


def _now() -> datetime:
    return datetime.now(UTC)


def _exercise_response(doc: dict) -> ExerciseResponse:
    return ExerciseResponse(id=doc["_id"], domain=doc["domain"], name=doc["name"], instructions=doc["instructions"], durationSeconds=doc["durationSeconds"], difficulty=doc["difficulty"], type=doc["type"], category=doc["category"], question=doc.get("question"), options=doc.get("options", []))


def list_exercises(domain: str | None, difficulty: str | None) -> list[ExerciseResponse]:
    query: dict = {"active": True}
    if domain:
        query["domain"] = domain
    if difficulty:
        query["difficulty"] = difficulty
    return [_exercise_response(doc) for doc in database.require_db().exercises.find(query, {"correct_answer": 0})]


def get_exercise(exercise_id: str) -> ExerciseResponse | None:
    doc = database.require_db().exercises.find_one({"_id": exercise_id, "active": True}, {"correct_answer": 0})
    return _exercise_response(doc) if doc else None


def submit_answer(payload: AnswerSubmission) -> AnswerResult:
    db = database.require_db()
    if not db.users.find_one({"_id": payload.user_id}):
        raise LookupError("User not found")
    exercise = db.exercises.find_one({"_id": payload.exercise_id, "active": True})
    if not exercise:
        raise LookupError("Exercise not found")
    answer = payload.answer if isinstance(payload.answer, str) else str(payload.answer)
    correct = answer.strip().casefold() == str(exercise.get("correct_answer", "")).strip().casefold()
    score = 100.0 if correct else 0.0
    attempt_count = db.attempts.count_documents({"user_id": payload.user_id, "exercise_id": payload.exercise_id}) + 1
    db.attempts.insert_one({"_id": f"att-{uuid4().hex}", "user_id": payload.user_id, "exercise_id": payload.exercise_id, "exercise_type": exercise["type"], "category": exercise["category"], "difficulty": exercise["difficulty"], "answer": answer, "correct": correct, "score": score, "response_time": payload.response_time, "attempt_number": attempt_count, "created_at": _now()})
    _refresh_progress(payload.user_id)
    return AnswerResult(exercise_id=payload.exercise_id, correct=correct, score=score, response_time=payload.response_time, feedback=feedback_for_score(score))


def submit_session(payload: CognitiveSessionCreate) -> CognitiveSessionResponse:
    """Compatibility endpoint for the existing supervised reaction-time UI."""
    db = database.require_db()
    now = _now()
    if not db.users.find_one({"_id": payload.patient_id}):
        db.users.insert_one({"_id": payload.patient_id, "name": payload.patient_id, "email": f"{payload.patient_id.lower()}@neurosync.local", "created_at": now, "preferences": {}})
    scores: dict[str, list[float]] = defaultdict(list)
    normalized: list[CognitiveResult] = []
    for result in payload.results:
        server_score = round(max(0, min(100, result.accuracyPct - result.avgReactionTimeMs / 100)), 2)
        corrected = result.model_copy(update={"score": server_score})
        normalized.append(corrected)
        scores[corrected.domain].append(server_score)
        db.attempts.insert_one({"_id": f"att-{uuid4().hex}", "user_id": payload.patient_id, "exercise_id": corrected.exerciseId, "exercise_type": corrected.exerciseType or "supervised_cognitive", "category": corrected.domain, "difficulty": "medium", "answer": None, "correct": corrected.accuracyPct >= 70, "score": server_score, "response_time": corrected.avgReactionTimeMs / 1000, "metrics": corrected.metrics, "attempt_number": 1, "created_at": now})
    domains = ["attention", "processing_speed", "memory", "cognitive_flexibility"]
    domain_scores = {domain: round(sum(scores[domain]) / len(scores[domain]), 2) if scores[domain] else 0.0 for domain in domains}
    session = {"_id": f"cs-{uuid4().hex}", "patientId": payload.patient_id, "date": now, "domainScores": domain_scores, "results": [item.model_dump() for item in normalized]}
    db.sessions.insert_one(session)
    db.patients.update_one({"patient_id": payload.patient_id}, {"$set": {"cognitive_status": "completed", "last_visit": now}})
    db.audit_events.insert_one({"id": f"cognitive-{payload.patient_id}-{now.timestamp()}", "patient_id": payload.patient_id, "timestamp": now, "actor": "clinician", "description": "Supervised cognitive assessment session completed."})
    _refresh_progress(payload.patient_id)
    return CognitiveSessionResponse(**session, id=session["_id"])


def history(patient_id: str) -> list[CognitiveSessionResponse]:
    docs = database.require_db().sessions.find({"patientId": patient_id}).sort("date", 1)
    return [CognitiveSessionResponse(**doc, id=doc["_id"]) for doc in docs]


def _refresh_progress(user_id: str) -> None:
    db = database.require_db()
    attempts = list(db.attempts.find({"user_id": user_id}).sort("created_at", -1))
    if not attempts:
        return
    category_values: dict[str, list[float]] = defaultdict(list)
    for attempt in attempts:
        category_values[attempt["category"]].append(float(attempt["score"]))
    payload = {"user_id": user_id, "cognitive_score": round(sum(float(a["score"]) for a in attempts) / len(attempts), 2), "total_attempts": len(attempts), "correct_attempts": sum(1 for a in attempts if a.get("correct")), "average_response_time": round(sum(float(a["response_time"]) for a in attempts) / len(attempts), 2), "category_scores": {category: round(sum(values) / len(values), 2) for category, values in category_values.items()}, "updated_at": _now()}
    db.progress.replace_one({"user_id": user_id}, payload, upsert=True)


def get_progress(user_id: str) -> ProgressResponse:
    db = database.require_db()
    doc = db.progress.find_one({"user_id": user_id})
    if not doc:
        if not db.users.find_one({"_id": user_id}):
            raise LookupError("User not found")
        return ProgressResponse(user_id=user_id, cognitive_score=0, total_attempts=0, correct_attempts=0, average_response_time=0, category_scores={}, recent_performance=[], updated_at=None)
    recent = list(db.attempts.find({"user_id": user_id}).sort("created_at", -1).limit(10))
    return ProgressResponse(**doc, recent_performance=[{"date": a["created_at"].date().isoformat(), "score": a["score"]} for a in reversed(recent)])
