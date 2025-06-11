from typing import Dict, Optional

from fastapi import HTTPException, status


class AuthError(HTTPException):
    """Base class for authentication errors."""

    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the authentication error.

        Args:
            detail (str): The error detail message.
            status_code (int): The HTTP status code.
            headers (Optional[Dict[str, str]]): Additional headers to include in the response.
        """
        if headers is None:
            headers = {"WWW-Authenticate": "Bearer"}
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class TokenError(AuthError):
    """Error related to token operations."""

    def __init__(
        self,
        detail: str = "Invalid token",
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the token error.

        Args:
            detail (str): The error detail message.
            status_code (int): The HTTP status code.
            headers (Optional[Dict[str, str]]): Additional headers to include in the response.
        """
        super().__init__(detail=detail, status_code=status_code, headers=headers)


class UserInfoError(AuthError):
    """Error related to user information operations."""

    def __init__(
        self,
        detail: str = "Failed to get user information",
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the user info error.

        Args:
            detail (str): The error detail message.
            status_code (int): The HTTP status code.
            headers (Optional[Dict[str, str]]): Additional headers to include in the response.
        """
        super().__init__(detail=detail, status_code=status_code, headers=headers)


class AuthorizationError(AuthError):
    """Error related to authorization operations."""

    def __init__(
        self,
        detail: str = "Not enough permissions",
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the authorization error.

        Args:
            detail (str): The error detail message.
            headers (Optional[Dict[str, str]]): Additional headers to include in the response.
        """
        super().__init__(
            detail=detail, status_code=status.HTTP_403_FORBIDDEN, headers=headers
        )


class RateLimitError(AuthError):
    """Error related to rate limiting."""

    def __init__(
        self,
        detail: str = "Too many requests",
        retry_after: int = 60,
        headers: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize the rate limit error.

        Args:
            detail (str): The error detail message.
            retry_after (int): The number of seconds after which the client can retry.
            headers (Optional[Dict[str, str]]): Additional headers to include in the response.
        """
        if headers is None:
            headers = {}
        headers["Retry-After"] = str(retry_after)

        super().__init__(
            detail=detail,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers=headers,
        )


class ConfigurationError(Exception):
    """Error related to configuration issues."""

    def __init__(self, detail: str = "Invalid configuration"):
        """
        Initialize the configuration error.

        Args:
            detail (str): The error detail message.
        """
        self.detail = detail
        super().__init__(detail)
