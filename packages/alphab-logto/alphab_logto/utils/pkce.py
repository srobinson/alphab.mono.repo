import base64
import hashlib
import os
from typing import Dict


class PKCEUtils:
    """
    Utility class for PKCE (Proof Key for Code Exchange) operations.

    PKCE is an extension to the OAuth 2.0 Authorization Code flow to prevent
    authorization code interception attacks.
    """

    @staticmethod
    def generate_code_verifier() -> str:
        """
        Generate a code verifier for PKCE.

        The code verifier is a cryptographically random string using the
        characters A-Z, a-z, 0-9, and the punctuation characters -._~ (hyphen,
        period, underscore, and tilde), between 43 and 128 characters long.

        Returns:
            str: A random code verifier string.
        """
        code_verifier = base64.urlsafe_b64encode(os.urandom(40)).decode("utf-8")
        return code_verifier.replace("=", "")

    @staticmethod
    def generate_code_challenge(code_verifier: str) -> str:
        """
        Generate a code challenge from the code verifier.

        The code challenge is derived from the code verifier by using the
        SHA-256 hash algorithm.

        Args:
            code_verifier (str): The code verifier to generate a challenge from.

        Returns:
            str: The code challenge derived from the code verifier.
        """
        code_challenge = hashlib.sha256(code_verifier.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(code_challenge).decode("utf-8").replace("=", "")

    @staticmethod
    def create_pkce_params() -> Dict[str, str]:
        """
        Create both code verifier and code challenge for PKCE.

        Returns:
            Dict[str, str]: A dictionary containing both the code_verifier and code_challenge.
        """
        code_verifier = PKCEUtils.generate_code_verifier()
        code_challenge = PKCEUtils.generate_code_challenge(code_verifier)

        return {"code_verifier": code_verifier, "code_challenge": code_challenge}
