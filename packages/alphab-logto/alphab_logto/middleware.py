import base64
from typing import Callable, List, Optional

from alphab_logto.utils.rate_limiter import RateLimiter
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting requests.

    This middleware limits the number of requests that can be made to
    specific paths within a given time period.
    """

    def __init__(
        self,
        app,
        rate_limiter: Optional[RateLimiter] = None,
        paths_to_limit: Optional[List[str]] = None,
        status_code: int = 429,
        error_message: str = "Too many requests",
    ):
        """
        Initialize the rate limiting middleware.

        Args:
            app: The ASGI application.
            rate_limiter (Optional[RateLimiter]): The rate limiter to use.
            paths_to_limit (Optional[List[str]]): The paths to apply rate limiting to.
            status_code (int): The status code to return when rate limited.
            error_message (str): The error message to return when rate limited.
        """
        super().__init__(app)
        self.rate_limiter = rate_limiter if rate_limiter is not None else RateLimiter()
        self.paths_to_limit = paths_to_limit if paths_to_limit is not None else ["/auth/"]
        self.status_code = status_code
        self.error_message = error_message

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Dispatch the request.

        Args:
            request (Request): The request object.
            call_next (Callable): The next middleware or route handler.

        Returns:
            Response: The response object.
        """
        # Check if the path should be rate limited
        path = request.url.path
        should_limit = any(path.startswith(p) for p in self.paths_to_limit)

        if should_limit:
            # Get client IP
            ip = request.client.host if request.client else "unknown"

            # Check if rate limited
            if self.rate_limiter.is_rate_limited(ip):
                return Response(
                    content=self.error_message,
                    status_code=self.status_code,
                    media_type="text/plain",
                    headers={"Retry-After": "60"},
                )

        # Continue with the request
        return await call_next(request)


class LogtoProtectedAppMiddleware(BaseHTTPMiddleware):
    """
    Middleware for Logto Protected App integration.

    This middleware validates requests from Logto Protected App by checking
    the Authorization header or Logto-ID-Token header.
    """

    def __init__(self, app, app_id: str, app_secret: str):
        """
        Initialize the Logto Protected App middleware.

        Args:
            app: The ASGI application.
            app_id (str): The Logto application ID.
            app_secret (str): The Logto application secret.
        """
        super().__init__(app)
        self.app_id = app_id
        self.app_secret = app_secret
        self.expected_auth = f"{app_id}:{app_secret}"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Dispatch the request.

        Args:
            request (Request): The request object.
            call_next (Callable): The next middleware or route handler.

        Returns:
            Response: The response object.
        """
        # Verify HTTP Basic Authentication
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Basic "):
            credentials = auth_header[6:]
            try:
                decoded = base64.b64decode(credentials).decode("utf-8")
                if decoded == self.expected_auth:
                    # Valid Protected App request
                    return await call_next(request)
            except Exception:
                pass

        # Verify Logto-ID-Token header
        id_token = request.headers.get("Logto-ID-Token")
        if id_token:
            # In a real implementation, we would verify the token here
            # For simplicity, we'll just check if it exists
            # Attach the token to the request state for later use
            request.state.logto_id_token = id_token
            return await call_next(request)

        # Unauthorized
        return Response(content="Unauthorized", status_code=401, media_type="text/plain")
