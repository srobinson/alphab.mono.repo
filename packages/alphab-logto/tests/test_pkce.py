import re
import unittest

# Import is handled by conftest.py
from alphab_logto.utils.pkce import PKCEUtils


class TestPKCEUtils(unittest.TestCase):
    """Test cases for PKCE utilities."""

    def setUp(self):
        """Set up test fixtures."""
        self.pkce_utils = PKCEUtils()

    def test_generate_code_verifier(self):
        """Test that code verifier generation produces valid output."""
        # Generate a code verifier
        code_verifier = self.pkce_utils.generate_code_verifier()

        # Check that it's a string
        self.assertIsInstance(code_verifier, str)

        # Check that it's the right length (43-128 characters)
        self.assertTrue(43 <= len(code_verifier) <= 128)

        # Check that it only contains valid characters (A-Z, a-z, 0-9, -, ., _, ~)
        self.assertTrue(re.match(r"^[A-Za-z0-9\-._~]+$", code_verifier))

        # Check that it doesn't contain padding characters (=)
        self.assertNotIn("=", code_verifier)

    def test_generate_code_challenge(self):
        """Test that code challenge generation produces valid output."""
        # Generate a code verifier
        code_verifier = self.pkce_utils.generate_code_verifier()

        # Generate a code challenge from the verifier
        code_challenge = self.pkce_utils.generate_code_challenge(code_verifier)

        # Check that it's a string
        self.assertIsInstance(code_challenge, str)

        # Check that it's the right length (43-128 characters)
        self.assertTrue(43 <= len(code_challenge) <= 128)

        # Check that it only contains valid characters (A-Z, a-z, 0-9, -, ., _, ~)
        self.assertTrue(re.match(r"^[A-Za-z0-9\-._~]+$", code_challenge))

        # Check that it doesn't contain padding characters (=)
        self.assertNotIn("=", code_challenge)

    def test_code_challenge_is_deterministic(self):
        """Test that the same code verifier always produces the same code challenge."""
        # Generate a code verifier
        code_verifier = self.pkce_utils.generate_code_verifier()

        # Generate two code challenges from the same verifier
        code_challenge1 = self.pkce_utils.generate_code_challenge(code_verifier)
        code_challenge2 = self.pkce_utils.generate_code_challenge(code_verifier)

        # Check that they're the same
        self.assertEqual(code_challenge1, code_challenge2)

    def test_different_verifiers_produce_different_challenges(self):
        """Test that different code verifiers produce different code challenges."""
        # Generate two code verifiers
        code_verifier1 = self.pkce_utils.generate_code_verifier()
        code_verifier2 = self.pkce_utils.generate_code_verifier()

        # Make sure they're different
        self.assertNotEqual(code_verifier1, code_verifier2)

        # Generate code challenges from the verifiers
        code_challenge1 = self.pkce_utils.generate_code_challenge(code_verifier1)
        code_challenge2 = self.pkce_utils.generate_code_challenge(code_verifier2)

        # Check that they're different
        self.assertNotEqual(code_challenge1, code_challenge2)

    def test_empty_verifier_raises_error(self):
        """Test that an empty code verifier raises an error."""
        with self.assertRaises(Exception):
            self.pkce_utils.generate_code_challenge("")

    def test_non_string_verifier_raises_error(self):
        """Test that a non-string code verifier raises an error."""
        with self.assertRaises(Exception):
            self.pkce_utils.generate_code_challenge("123")


if __name__ == "__main__":
    unittest.main()
