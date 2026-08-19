"""Seed a safe, repeatable cognitive-training demo dataset.

Run with: python -m backend.seed.seed_data
"""
from datetime import UTC, datetime

from backend.database.connection import database


EXERCISES = [
    {"_id": "ex-reaction", "domain": "attention", "name": "Reaction Time", "instructions": "Tap the button as soon as the shape turns green.", "durationSeconds": 60, "difficulty": "easy", "type": "reaction", "category": "attention", "question": "What color signals that you should tap?", "options": ["Green", "Blue", "Red"], "correct_answer": "Green", "active": True},
    {"_id": "ex-symbol", "domain": "processing_speed", "name": "Symbol Matching", "instructions": "Match each symbol to its corresponding number as quickly as you can.", "durationSeconds": 90, "difficulty": "medium", "type": "matching", "category": "processing_speed", "question": "Which symbol matches the reference circle?", "options": ["Circle", "Square", "Triangle"], "correct_answer": "Circle", "active": True},
    {"_id": "ex-target", "domain": "attention", "name": "Target Detection", "instructions": "Tap only when the target shape appears among distractors.", "durationSeconds": 60, "difficulty": "medium", "type": "target_detection", "category": "attention", "question": "Select the target: triangle", "options": ["Circle", "Triangle", "Square"], "correct_answer": "Triangle", "active": True},
    {"_id": "ex-sequence", "domain": "memory", "name": "Working-Memory Sequence", "instructions": "Repeat the sequence of highlighted tiles in the same order.", "durationSeconds": 90, "difficulty": "medium", "type": "sequence", "category": "memory", "question": "Repeat this sequence: 2, 4, 1", "options": ["2, 4, 1", "1, 4, 2", "2, 1, 4"], "correct_answer": "2, 4, 1", "active": True},
    {"_id": "ex-flex", "domain": "cognitive_flexibility", "name": "Rule Switch", "instructions": "Sort each card by color, then switch to sorting by shape when prompted.", "durationSeconds": 75, "difficulty": "hard", "type": "rule_switch", "category": "cognitive_flexibility", "question": "After the rule changes to shape, what should guide your choice?", "options": ["Color", "Shape", "Size"], "correct_answer": "Shape", "active": True},
]


def main() -> None:
    database.connect()
    try:
        db = database.require_db()
        db.users.update_one({"_id": "demo-user"}, {"$setOnInsert": {"name": "Demo User", "email": "demo@neurosync.local", "preferences": {"difficulty": "medium"}, "created_at": datetime.now(UTC)}}, upsert=True)
        for exercise in EXERCISES:
            db.exercises.replace_one({"_id": exercise["_id"]}, exercise, upsert=True)
        print("Seed complete. Demo user: demo-user")
    finally:
        database.close()


if __name__ == "__main__":
    main()
