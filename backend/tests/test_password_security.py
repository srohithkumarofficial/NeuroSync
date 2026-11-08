import unittest

from backend.security.passwords import hash_password, verify_password


class PasswordSecurityTests(unittest.TestCase):
    def test_hash_password_is_not_plaintext(self) -> None:
        password = "A-secure-demo-password"
        stored = hash_password(password)

        self.assertNotEqual(stored, password)
        self.assertTrue(verify_password(password, stored))
        self.assertFalse(verify_password("wrong-password", stored))

    def test_legacy_plaintext_passwords_are_still_accepted(self) -> None:
        self.assertTrue(verify_password("legacy-password", "legacy-password"))
        self.assertFalse(verify_password("wrong-password", "legacy-password"))


if __name__ == "__main__":
    unittest.main()
