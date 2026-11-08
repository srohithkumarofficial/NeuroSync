"""Seed the persistent cognitive exercise catalog.

Run with: python -m backend.seed.seed_data
"""
from datetime import UTC, datetime

from backend.config.settings import get_settings
from backend.database.connection import database
from backend.security.passwords import hash_password


EXERCISES = [
    {"_id": "ex-target", "domain": "attention", "name": "Target Detection", "instructions": "Click only when the target number 7 appears.", "durationSeconds": 60, "difficulty": "medium", "type": "target_detection", "category": "attention", "question": "Which number is the target?", "options": ["7", "3", "9"], "correct_answer": "7", "active": True},
    {"_id": "ex-symbol", "domain": "processing_speed", "name": "Processing Speed Reaction", "instructions": "Tap the button as soon as the signal changes.", "durationSeconds": 60, "difficulty": "medium", "type": "processing_speed_reaction", "category": "processing_speed", "question": "What signal means respond?", "options": ["Green", "Blue", "Red"], "correct_answer": "Green", "active": True},
    {"_id": "ex-sequence", "domain": "memory", "name": "Sequence Recall", "instructions": "Memorize each word sequence, then reproduce the order.", "durationSeconds": 90, "difficulty": "medium", "type": "sequence_recall", "category": "memory", "question": "Recall the displayed word sequence.", "options": [], "correct_answer": "", "active": True},
    {"_id": "ex-flex", "domain": "cognitive_flexibility", "name": "Task Switching", "instructions": "Apply the number or letter rule for each trial.", "durationSeconds": 75, "difficulty": "hard", "type": "task_switching", "category": "cognitive_flexibility", "question": "Numbers use even/odd; letters use before/after M.", "options": ["Even", "Odd", "Before M", "After M"], "correct_answer": "", "active": True},
]


def main() -> None:
    settings = get_settings()
    if not settings.default_clinician_password:
        raise RuntimeError("Set DEFAULT_CLINICIAN_PASSWORD in backend/.env before seeding the database.")

    clinician = {
        "_id": "clin-001",
        "name": "Dr. Arjun Raj",
        "email": settings.default_clinician_email.lower().strip(),
        "password": hash_password(settings.default_clinician_password),
        "role": "Neurologist",
        "hospital": "NeuroSync Clinical Center",
        "preferences": {},
    }

    database.connect()
    try:
        db = database.require_db()
        db.users.replace_one({"_id": clinician["_id"]}, {**clinician, "created_at": datetime.now(UTC)}, upsert=True)
        for exercise in EXERCISES:
            db.exercises.replace_one({"_id": exercise["_id"]}, exercise, upsert=True)
        print("Seed complete: clinician account and exercise catalog are ready.")
    finally:
        database.close()


if __name__ == "__main__":
    main()
