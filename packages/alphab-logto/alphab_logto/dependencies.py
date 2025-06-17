from datetime import datetime
from typing import Any, Callable, Coroutine

from alphab_logto.exceptions import AuthError, TokenError
from alphab_logto.models import LogtoAuthConfig, TokenData
from alphab_logto.services.auth_service import AuthService
from alphab_logto.services.logging_service import LoggingService
from alphab_logto.services.token_service import TokenService
from alphab_logto.utils.http_client import HttpClientManager
from alphab_logto.utils.pkce import PKCEUtils
from fastapi import Depends, Request


def get_config(request: Request) -> LogtoAuthConfig | Any:
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


async def get_current_user(request: Request, token_service: TokenService = Depends(get_token_service)) -> TokenData:
    """
    Get the current user from the token.

    This dependency intelligently handles both JWTs and opaque tokens. It checks
    the token format to decide whether to perform local JWT validation (fast) or
    call the UserInfo endpoint (slower).

    Args:
        request (Request): The request object.
        token_service (TokenService): The token service.

    Returns:
        TokenData: The token data.

    Raises:
        AuthError: If the user is not authenticated or the token is invalid.
    """
    if request.method == "OPTIONS":
        raise AuthError("Not authenticated", status_code=401)

    authorization = request.headers.get("Authorization")
    if not authorization:
        raise AuthError("Not authenticated", status_code=401)

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise AuthError("Invalid authorization scheme", status_code=401)
    except ValueError:
        raise AuthError("Invalid authorization header format", status_code=401)

    # Check if the token has the format of a JWT (three parts separated by dots)
    if len(token.split(".")) == 3:
        # Token appears to be a JWT, attempt local validation (fast path)
        try:
            payload = await token_service.validate_jwt(token)
            sub = payload.get("sub")
            if not sub:
                raise AuthError("Invalid JWT: missing 'sub' claim", status_code=401)
            roles = payload.get("roles", [])
            exp = datetime.fromtimestamp(payload["exp"]) if "exp" in payload else None
            return TokenData(sub=sub, roles=roles, exp=exp)
        except TokenError as e:
            # The token looked like a JWT but failed validation
            raise AuthError(f"Invalid JWT: {e}", status_code=401)
        except Exception as e:
            raise AuthError(f"JWT processing error: {e}", status_code=401)
    else:
        # Token does not look like a JWT, assume it's opaque and use userinfo endpoint (slower path)
        try:
            user_info = await token_service.get_user_info_from_token(token)
            sub = user_info.get("sub")
            if not sub:
                raise AuthError("Invalid token: missing subject in userinfo", status_code=401)
            roles = user_info.get("roles", [])
            exp = datetime.fromtimestamp(user_info["exp"]) if "exp" in user_info else None
            return TokenData(sub=sub, roles=roles, exp=exp)
        except Exception as e:
            raise AuthError(f"Opaque token validation failed: {e}", status_code=401)


def has_role(required_roles: list[str]) -> Callable[[TokenData], Coroutine[Any, Any, Any]]:
    """
    Dependency for role-based access control.

    Args:
        required_roles (list[str]): The required roles.

    Returns:
        Callable: The dependency function.
    """

    async def role_checker(token_data: TokenData = Depends(get_current_user)) -> TokenData:
        if not required_roles:
            return token_data

        user_roles = set(token_data.roles)
        if not any(role in user_roles for role in required_roles):
            raise AuthError("Not enough permissions", status_code=403)

        return token_data

    return role_checker
