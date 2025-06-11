"""
Logto Auth - A reusable authentication package for FastAPI applications using Logto.

This package provides a complete authentication solution for FastAPI applications
using Logto as the authentication provider. It includes:

- PKCE authentication flow
- Token management
- User information retrieval
- Role-based access control
- Rate limiting
- Protected App integration
"""

from alphab_logto.middleware import RateLimitingMiddleware
from alphab_logto.models import LogtoAuthConfig
from alphab_logto.routes import router
from alphab_logto.utils.rate_limiter import RateLimiter
from fastapi import FastAPI

__version__ = "0.1.0"

# Re-export these classes to make them available when importing from logto_auth
__all__ = [
    "LogtoAuthConfig",
    "RateLimiter",
    "RateLimitingMiddleware",
    "has_role",
    "setup_auth",
]


def setup_auth(app: FastAPI, config: LogtoAuthConfig, prefix: str = "/auth") -> FastAPI:
    """
    Set up authentication for a FastAPI application.

    This function configures the FastAPI application with the authentication
    routes and middleware.

    Args:
        app (FastAPI): The FastAPI application.
        config (LogtoAuthConfig): The authentication configuration.
        prefix (str): The URL prefix for authentication routes.

    Returns:
        FastAPI: The configured FastAPI application.
    """
    # Register middleware
    if config.enable_rate_limiting:
        rate_limiter = RateLimiter(requests_per_minute=config.rate_limit_requests_per_minute)
        app.add_middleware(
            RateLimitingMiddleware,
            rate_limiter=rate_limiter,
            paths_to_limit=[f"{prefix}/"],
        )

    # Register routes
    app.include_router(router, prefix=prefix)

    # Store config for dependency injection
    app.state.logto_auth_config = config

    return app
