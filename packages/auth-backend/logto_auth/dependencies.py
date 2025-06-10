from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import Depends, Request
from logto_auth.exceptions import AuthError, TokenError
from logto_auth.models import LogtoAuthConfig, TokenData
from logto_auth.services.auth_service import AuthService
from logto_auth.services.logging_service import LoggingService
from logto_auth.services.token_service import TokenService
from logto_auth.utils.http_client import HttpClientManager
from logto_auth.utils.pkce import PKCEUtils


def get_config(request: Request) -> LogtoAuthConfig:
    """
    Get the Logto auth configuration from the request state.

    Args:
        request (Request): The request object.

    Returns:
        LogtoAuthConfig: The authentication configuration.
    """
    return request.app.state.logto_auth_config


def get_http_client_manager() -> HttpClientManager:
    """
    Get the HTTP client manager.

    Returns:
        HttpClientManager: The HTTP client manager.
    """
    return HttpClientManager()


def get_pkce_utils() -> PKCEUtils:
    """
    Get the PKCE utilities.

    Returns:
        PKCEUtils: The PKCE utilities.
    """
    return PKCEUtils()


def get_logging_service() -> LoggingService:
    """
    Get the logging service.

    Returns:
        LoggingService: The logging service.
    """
    return LoggingService()


def get_token_service(
    config: LogtoAuthConfig = Depends(get_config),
    http_client_manager: HttpClientManager = Depends(get_http_client_manager),
    logging_service: LoggingService = Depends(get_logging_service),
) -> TokenService:
    """
    Get the token service.

    Args:
        config (LogtoAuthConfig): The authentication configuration.
        http_client_manager (HttpClientManager): The HTTP client manager.
        logging_service (LoggingService): The logging service.

    Returns:
        TokenService: The token service.
    """
    return TokenService(
        config=config,
        http_client_manager=http_client_manager,
        logging_service=logging_service,
    )


def get_auth_service(
    config: LogtoAuthConfig = Depends(get_config),
    pkce_utils: PKCEUtils = Depends(get_pkce_utils),
    token_service: TokenService = Depends(get_token_service),
    logging_service: LoggingService = Depends(get_logging_service),
) -> AuthService:
    """
    Get the authentication service.

    Args:
        config (LogtoAuthConfig): The authentication configuration.
        pkce_utils (PKCEUtils): The PKCE utilities.
        token_service (TokenService): The token service.
        logging_service (LoggingService): The logging service.

    Returns:
        AuthService: The authentication service.
    """
    return AuthService(
        pkce_utils=pkce_utils,
        token_service=token_service,
        logging_service=logging_service,
        config=config,
    )


async def get_current_user(
    request: Request, token_service: TokenService = Depends(get_token_service)
) -> TokenData:
    """
    Get the current user from the token.

    Args:
        request (Request): The request object.
        token_service (TokenService): The token service.

    Returns:
        TokenData: The token data.

    Raises:
        AuthError: If the user is not authenticated.
    """
    # Handle OPTIONS requests
    if request.method == "OPTIONS":
        raise AuthError(
            "Not authenticated",
            status_code=401,
        )

    # Get the Authorization header
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise AuthError(
            "Not authenticated",
            status_code=401,
        )

    # Parse the Authorization header
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise AuthError(
                "Not authenticated",
                status_code=401,
            )
    except ValueError:
        raise AuthError(
            "Invalid authorization header",
            status_code=401,
        )

    # Get user info from token
    try:
        user_info = await token_service.get_user_info_from_token(token)

        # Extract user ID from subject claim
        sub = user_info.get("sub")
        if not sub:
            raise AuthError("Invalid token: missing subject", status_code=401)

        # Extract user roles if available
        roles = user_info.get("roles", [])

        # Get token expiration if available
        exp = None
        if "exp" in user_info:
            exp = datetime.fromtimestamp(user_info["exp"])

        return TokenData(sub=sub, roles=roles, exp=exp)
    except Exception as e:
        raise AuthError(
            str(e),
            status_code=401,
        )


def has_role(required_roles: list[str]):
    """
    Dependency for role-based access control.

    Args:
        required_roles (list[str]): The required roles.

    Returns:
        Callable: The dependency function.
    """

    async def role_checker(token_data: TokenData = Depends(get_current_user)):
        # If no roles are required, allow access
        if not required_roles:
            return token_data

        # Check if user has any of the required roles
        for role in required_roles:
            if role in token_data.roles:
                return token_data

        # User doesn't have the required roles
        raise AuthError(
            "Not enough permissions",
            status_code=403,
        )

    return role_checker
