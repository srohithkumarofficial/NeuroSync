import re

SAFE_FEEDBACK = "I can help with exercise performance, but I cannot provide a medical diagnosis."
UNSAFE_PATTERNS = (
    r"\bdiagnos(?:e|is|ed)\b", r"\bmedical condition\b", r"\bms is (?:worse|progressing)\b",
    r"\bmedication\b", r"\btreatment\b", r"\byou have\b.*\bimpairment\b",
)


def safe_feedback(text: str) -> str:
    cleaned = " ".join(text.split())
    if not cleaned or len(cleaned) > 280 or any(re.search(pattern, cleaned, re.I) for pattern in UNSAFE_PATTERNS):
        return SAFE_FEEDBACK
    return cleaned


def feedback_for_score(score: float) -> str:
    if score >= 90:
        return safe_feedback("Excellent work! You performed very well on this exercise.")
    if score >= 70:
        return safe_feedback("Good job! Keep practicing to improve your accuracy.")
    return safe_feedback("Good attempt. Let's practice this skill again.")
