from backend.schemas.common import Difficulty


def recommend_difficulty(recent_score: float | None, preferred: str | None = None) -> tuple[Difficulty, str]:
    current: Difficulty = preferred if preferred in {"easy", "medium", "hard"} else "medium"  # type: ignore[assignment]
    if recent_score is None:
        return current, "Start with a balanced exercise while we learn your practice preferences."
    if recent_score >= 90:
        return ("hard" if current == "medium" else current), "Your recent exercise performance is strong, so this offers a greater challenge."
    if recent_score < 70:
        return "easy", "This reinforces the skill at a more approachable level."
    return current, "This keeps the challenge aligned with your recent exercise performance."
