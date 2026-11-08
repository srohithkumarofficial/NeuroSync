import hashlib
import hmac
import secrets


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 and a random per-password salt."""
    if not password:
        raise ValueError("Password must not be empty.")

    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, password_record: str | None) -> bool:
    """Verify a password against either the secure salted format or the legacy plaintext format."""
    if not password_record:
        return False

    if "$" not in password_record:
        return hmac.compare_digest(password, password_record)

    salt, separator, digest = password_record.partition("$")
    if not separator or not salt or not digest:
        return False

    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000).hex()
    return hmac.compare_digest(candidate, digest)
