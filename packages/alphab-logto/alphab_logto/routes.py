from datetime import datetime, timedelta
from typing import Optional

from alphab_logto.dependencies import get_auth_service, get_current_user, has_role
from alphab_logto.models import TokenData, UserInfo
from alphab_logto.services.auth_service import AuthService
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from starlette import status

router = APIRouter()


@router.get("/signin")
async def signin(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    """
    Initiate the Logto sign-in flow.

    This endpoint redirects the user to the Logto authentication page.
    """
    return await auth_service.initiate_signin(request)


@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Handle the callback from Logto after user authentication.

    This endpoint exchanges the authorization code for tokens and redirects
    the user back to the frontend.
    """
    return await auth_service.handle_callback(request, code, error, error_description)


@router.options("/signout")
async def options_signout():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/signout")
async def signout(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    """
    Sign out the current user.

    This endpoint signs the user out and redirects them back to the frontend.
    """
    return await auth_service.handle_signout(request)


@router.get("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    user: TokenData = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Refresh the access token.

    This endpoint refreshes the access token using the refresh token.
    """
    # Get the refresh token from the header
    refresh_token = request.headers.get("X-Refresh-Token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required",
        )

    # Refresh the token
    return await auth_service.refresh_access_token(refresh_token)


@router.options("/me")
async def options_user_info():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/me", response_model=UserInfo)
async def get_user_info(
    request: Request,
    user: TokenData = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Get information about the current user.

    This endpoint returns information about the authenticated user.
    """
    return await auth_service.get_user_info(request, user)


@router.get("/protected")
async def protected_route(user: TokenData = Depends(has_role(["admin"]))):
    """
    Example of a protected route that requires the "admin" role.

    This endpoint is only accessible to users with the "admin" role.
    """
    return {
        "message": "You have access to this protected resource",
        "user_id": user.sub,
    }


@router.get("/test-jwt", response_model=TokenData)
async def test_jwt_route(user: TokenData = Depends(get_current_user)):
    """
    A test route to verify JWT validation.

    This endpoint is protected by the get_current_user dependency. When hit with
    a valid JWT, it will return the token's claims, confirming that the JWT
    validation path is working correctly.
    """
    return user


@router.options("/session")
async def options_session():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/session")
async def get_session(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    """
    Get the current session information.

    This endpoint returns information about the current session.
    """
    try:
        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            return {"isAuthenticated": False, "user": None}

        # Parse the Authorization header
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return {"isAuthenticated": False, "user": None}
        except ValueError:
            return {"isAuthenticated": False, "user": None}

        # Get user info from token
        try:
            user_info = await auth_service.token_service.get_user_info_from_token(token)

            # Extract user ID from subject claim
            sub = user_info.get("sub")
            if not sub:
                return {"isAuthenticated": False, "user": None}

            # Extract user roles if available
            roles = user_info.get("roles", [])

            # Return the session information
            return {
                "isAuthenticated": True,
                "user": {
                    "id": sub,
                    "name": user_info.get("name"),
                    "email": user_info.get("email"),
                    "picture": user_info.get("picture"),
                    "roles": roles,
                    "username": user_info.get("username"),
                    "email_verified": user_info.get("email_verified"),
                    "created_at": user_info.get("created_at"),
                    "updated_at": user_info.get("updated_at"),
                },
            }
        except Exception as e:
            return {"isAuthenticated": False, "user": None, "error": str(e)}
    except Exception as e:
        return {"isAuthenticated": False, "user": None, "error": str(e)}


@router.options("/token")
async def options_token():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/token")
async def get_token(request: Request):
    """
    Get the current access token.

    This endpoint returns the current access token.
    """
    try:
        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            return {"accessToken": None}

        # Parse the Authorization header
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return {"accessToken": None}
        except ValueError:
            return {"accessToken": None}

        # Return the token
        return {"accessToken": token}
    except Exception as e:
        return {"accessToken": None, "error": str(e)}


@router.options("/validate-token")
async def options_validate_token():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/validate-token")
async def validate_token(request: Request, auth_service: AuthService = Depends(get_auth_service)):
    """
    Validate the current token and return a new one if needed.

    This endpoint validates the current token and returns a new one if it's
    about to expire.
    """
    try:
        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            return {"valid": False, "error": "No token provided"}

        # Parse the Authorization header
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return {"valid": False, "error": "Invalid authorization scheme"}
        except ValueError:
            return {"valid": False, "error": "Invalid Authorization header format"}

        # Try to get user info from token
        try:
            user_info = await auth_service.token_service.get_user_info_from_token(token)

            # Check if token is about to expire (within 5 minutes)
            if "exp" in user_info:
                exp_time = datetime.fromtimestamp(user_info["exp"])
                if exp_time - datetime.utcnow() < timedelta(minutes=5):
                    # Token is about to expire, but we can't create a new one directly
                    # Instead, return a flag indicating the token should be refreshed
                    return {"valid": True, "renew": True}

            # Token is valid and not about to expire
            return {"valid": True, "renew": False}
        except Exception as e:
            # Token verification failed
            return {"valid": False, "error": str(e)}
    except Exception as e:
        return {"valid": False, "error": str(e)}
