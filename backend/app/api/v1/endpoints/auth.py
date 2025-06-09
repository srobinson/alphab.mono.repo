import base64
import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

import httpx
from app.core.auth import TokenData, create_access_token, get_current_user
from app.core.auth import get_user_info as get_user_info_from_logto
from app.core.auth import has_role, log_auth_event, logto_settings
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

router = APIRouter()


# PKCE (Proof Key for Code Exchange) utilities
def generate_code_verifier() -> str:
    """Generate a code verifier for PKCE."""
    code_verifier = base64.urlsafe_b64encode(os.urandom(40)).decode("utf-8")
    return code_verifier.replace("=", "")


def generate_code_challenge(code_verifier: str) -> str:
    """Generate a code challenge from the code verifier."""
    code_challenge = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(code_challenge).decode("utf-8").replace("=", "")


print("settings ================>", settings)


class TokenResponse(BaseModel):
    """Token response model."""

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None


class UserInfo(BaseModel):
    """User information model."""

    sub: str
    name: Optional[str] = None
    email: Optional[str] = None
    picture: Optional[str] = None
    roles: list[str] = []
    username: Optional[str] = None
    email_verified: Optional[bool] = None
    created_at: Optional[int] = None
    updated_at: Optional[int] = None


@router.get("/signin")
async def signin(request: Request):
    """
    Initiate the Logto sign-in flow.
    """
    # Use provided redirect URI or fallback to the configured one
    callback_uri = settings.LOGTO_REDIRECT_URI

    print("callback_uri ================>", callback_uri)

    # Generate PKCE code verifier and challenge
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    # Store the code verifier in the session
    # In a real app, you would use a proper session management system
    # For simplicity, we'll use a cookie
    # Construct the Logto authorization URL
    auth_url = (
        f"{logto_settings.endpoint}/oidc/auth?"
        f"client_id={logto_settings.app_id}&"
        f"response_type=code&"
        f"redirect_uri={callback_uri}&"
        "scope=openid+profile+email+offline_access&"
        "prompt=login&"  # Always show the login form, even if the user is already authenticated
        f"code_challenge={code_challenge}&"
        "code_challenge_method=S256"
    )

    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key="code_verifier",
        value=code_verifier,
        httponly=True,
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"),
        max_age=600,  # 10 minutes
    )

    # Get redirect URI from query params if provided
    redirect_uri = request.query_params.get("redirectUri")
    if redirect_uri:
        response.set_cookie(
            key="post_login_redirect",
            value=redirect_uri,
            httponly=True,
            secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"),
            max_age=600,  # 10 minutes
        )

    # Log the sign-in initiation
    await log_auth_event(
        request=request,
        event_type="signin_initiation",
        details="User redirected to Logto for authentication",
    )
    return response


@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    state: Optional[str] = None,
):
    """
    Handle the callback from Logto after user authentication.
    """
    # Check for errors from Logto
    if error:
        error_msg = f"Authentication error: {error}"
        if error_description:
            error_msg += f" - {error_description}"

        # Log the error
        await log_auth_event(
            request=request,
            event_type="authentication",
            success=False,
            details=error_msg,
        )

        # Redirect to frontend with error
        frontend_url = settings.BACKEND_CORS_ORIGINS.split(",")[0]
        return RedirectResponse(url=f"{frontend_url}?error={error}")

    # Ensure code is provided
    if not code:
        await log_auth_event(
            request=request,
            event_type="authentication",
            success=False,
            details="No authorization code provided",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No authorization code provided",
        )

    try:
        # Get the code verifier from the cookie
        code_verifier = request.cookies.get("code_verifier")
        if not code_verifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No code verifier found. Please try signing in again.",
            )

        # Exchange the authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                logto_settings.token_endpoint,
                data={
                    "client_id": logto_settings.app_id,
                    "client_secret": logto_settings.app_secret,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LOGTO_REDIRECT_URI,
                    "code_verifier": code_verifier,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if token_response.status_code != 200:
                # Log the failed token exchange
                await log_auth_event(
                    request=request,
                    event_type="token_exchange",
                    success=False,
                    details=f"Failed to exchange code for tokens: {token_response.text}",
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to authenticate with Logto",
                )

            tokens = token_response.json()

            # Debug log the tokens response
            print(f"Tokens response from Logto: {tokens}")

            # Verify the ID token to get user information
            id_token = tokens.get("id_token")
            if not id_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No ID token received from Logto",
                )

            # In a real app, you would verify the ID token here
            # For simplicity, we'll just decode it without verification

            # Create a session or return tokens
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = tokens.get("expires_in", 3600)

            print(f"Access token: {access_token[:10]}...")
            print(f"Refresh token present: {refresh_token is not None}")

            # Log the successful authentication
            await log_auth_event(
                request=request,
                event_type="authentication",
                success=True,
                details="User authenticated via Logto",
            )

            # Get the post-login redirect URI from the cookie if available
            post_login_redirect = request.cookies.get("post_login_redirect", "/")

            # Create response and clear cookies
            # Get the first CORS origin as the frontend URL
            frontend_url = settings.BACKEND_CORS_ORIGINS.split(",")[0]

            # Make sure we're using the correct path for the callback
            # The frontend expects the callback at /auth/callback
            # Pass both access token and refresh token to the frontend
            redirect_url = f"{frontend_url}/auth/callback?token={access_token}"
            if refresh_token:
                redirect_url += f"&refresh_token={refresh_token}"
                print(f"Added refresh token to redirect URL")
            else:
                print(f"WARNING: No refresh token received from Logto")

            print(f"Redirecting to: {redirect_url}")

            response = RedirectResponse(url=redirect_url)
            response.delete_cookie("code_verifier")
            response.delete_cookie("post_login_redirect")

            return response

    except Exception as e:
        # Log the error
        await log_auth_event(
            request=request,
            event_type="authentication",
            success=False,
            details=f"Authentication error: {str(e)}",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )


@router.options("/signout")
async def options_signout():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/signout")
async def signout(request: Request):
    """
    Sign out the current user.
    """
    try:
        # Get user ID from Authorization header if available
        user_id = None
        authorization = request.headers.get("Authorization")
        if authorization:
            try:
                scheme, token = authorization.split()
                if scheme.lower() == "bearer":
                    try:
                        payload = await get_user_info_from_logto(token)
                        user_id = payload.get("sub")
                    except:
                        # If token verification fails, continue without user_id
                        pass
            except:
                # If parsing fails, continue without user_id
                pass

        # Log the sign-out
        await log_auth_event(
            request=request,
            event_type="signout",
            user_id=user_id,
            success=True,
            details="User signed out",
        )

        # In a real app, you would revoke the session/token here

        # Redirect to the frontend
        frontend_url = settings.BACKEND_CORS_ORIGINS.split(",")[0]
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_303_SEE_OTHER)

    except Exception as e:
        # Log the error
        await log_auth_event(
            request=request,
            event_type="signout",
            user_id=None,
            success=False,
            details=f"Sign-out error: {str(e)}",
        )

        # Still redirect to frontend even on error
        frontend_url = settings.BACKEND_CORS_ORIGINS.split(",")[0]
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_303_SEE_OTHER)


@router.get("/refresh")
async def refresh_token(
    request: Request, response: Response, user: TokenData = Depends(get_current_user)
):
    """
    Refresh the access token.
    """
    try:
        # Get the refresh token from the header
        refresh_token = request.headers.get("X-Refresh-Token")

        if not refresh_token:
            # Don't create a local token, return an error instead
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token required",
            )

        # Exchange the refresh token for a new access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                logto_settings.token_endpoint,
                data={
                    "client_id": logto_settings.app_id,
                    "client_secret": logto_settings.app_secret,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        if token_response.status_code != 200:
            # Log the failed token refresh
            await log_auth_event(
                request=request,
                event_type="token_refresh",
                user_id=user.sub,
                success=False,
                details=f"Failed to refresh token: {token_response.text}",
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh token",
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        new_refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)

        # Log the token refresh
        await log_auth_event(
            request=request,
            event_type="token_refresh",
            user_id=user.sub,
            success=True,
            details="Token refreshed with Logto",
        )

        # Return both tokens
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token if new_refresh_token else refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    except Exception as e:
        # Log the error
        await log_auth_event(
            request=request,
            event_type="token_refresh",
            user_id=user.sub if user else None,
            success=False,
            details=f"Token refresh error: {str(e)}",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh error: {str(e)}",
        )


@router.options("/me")
async def options_user_info():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/me", response_model=UserInfo)
async def get_user_info(request: Request, user: TokenData = Depends(get_current_user)):
    """
    Get information about the current user.
    """
    # Log the request headers for debugging
    print("Request headers:", request.headers)

    try:
        # Get the token from the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            return UserInfo(
                sub=user.sub,
                roles=user.roles,
            )

        # Parse the Authorization header
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return UserInfo(
                sub=user.sub,
                roles=user.roles,
            )

        # Get user info from Logto
        payload = await get_user_info_from_logto(token)

        # Return the user info
        return UserInfo(
            sub=payload.get("sub", user.sub),
            name=payload.get("name"),
            email=payload.get("email"),
            picture=payload.get("picture"),
            roles=user.roles,
            username=payload.get("username"),
            email_verified=payload.get("email_verified"),
            created_at=payload.get("created_at"),
            updated_at=payload.get("updated_at"),
        )
    except Exception as e:
        print(f"Error getting user info: {str(e)}")
        # Fallback to basic user info
        return UserInfo(
            sub=user.sub,
            roles=user.roles,
        )


@router.get("/protected")
async def protected_route(user: TokenData = Depends(has_role(["admin"]))):
    """
    Example of a protected route that requires the "admin" role.
    """
    return {"message": "You have access to this protected resource", "user_id": user.sub}


@router.options("/session")
async def options_session():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/session")
async def get_session(request: Request):
    """
    Get the current session information.
    Similar to the NextJS example's /api/auth/session endpoint.
    """
    try:
        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            print("No Authorization header")
            return {"isAuthenticated": False, "user": None}

        # Parse the Authorization header
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                print(f"Invalid authorization scheme: {scheme}")
                return {"isAuthenticated": False, "user": None}
        except ValueError:
            print(f"Invalid Authorization header format: {authorization}")
            return {"isAuthenticated": False, "user": None}

        # Verify the token
        try:
            payload = await get_user_info_from_logto(token)

            # Extract user ID from subject claim
            sub = payload.get("sub")
            if not sub:
                print("No subject claim in token")
                return {"isAuthenticated": False, "user": None}

            # Extract user roles if available
            roles = payload.get("roles", [])

            # Return the session information with additional user data
            return {
                "isAuthenticated": True,
                "user": {
                    "id": sub,
                    "name": payload.get("name"),
                    "email": payload.get("email"),
                    "picture": payload.get("picture"),
                    "roles": roles,
                    "username": payload.get("username"),
                    "email_verified": payload.get("email_verified"),
                    "created_at": payload.get("created_at"),
                    "updated_at": payload.get("updated_at"),
                },
            }
        except HTTPException as e:
            print(f"Token verification error: {e.detail}")
            return {"isAuthenticated": False, "user": None}
        except Exception as e:
            print(f"Unexpected token verification error: {str(e)}")
            return {"isAuthenticated": False, "user": None}
    except Exception as e:
        print(f"Session error: {str(e)}")
        return {"isAuthenticated": False, "user": None}


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
    Similar to the NextJS example's /api/auth/token endpoint.
    """
    try:
        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            print("No Authorization header in token request")
            return {"accessToken": None}

        # Parse the Authorization header
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                print(f"Invalid authorization scheme in token request: {scheme}")
                return {"accessToken": None}
        except ValueError:
            print(f"Invalid Authorization header format in token request: {authorization}")
            return {"accessToken": None}

        # Return the token
        return {"accessToken": token}
    except Exception as e:
        print(f"Token error: {str(e)}")
        return {"accessToken": None}


@router.options("/validate-token")
async def options_validate_token():
    """
    Handle OPTIONS request for CORS preflight.
    """
    return {}


@router.get("/validate-token")
async def validate_token(request: Request):
    """
    Validate the current token and return a new one if needed.
    This endpoint will:
    1. Check if the token is valid
    2. If valid, return success
    3. If invalid but can be refreshed, return a new token
    4. If invalid and can't be refreshed, return an error
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

        # Try to verify the token
        try:
            payload = await get_user_info_from_logto(token)

            # Check if token is about to expire (within 5 minutes)
            if "exp" in payload:
                exp_time = datetime.fromtimestamp(payload["exp"])
                if exp_time - datetime.utcnow() < timedelta(minutes=5):
                    # Token is about to expire, create a new one
                    new_token = await create_access_token(
                        data={"sub": payload.get("sub"), "roles": payload.get("roles", [])},
                        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                    )
                    return {"valid": True, "renew": True, "token": new_token}

            # Token is valid and not about to expire
            return {"valid": True, "renew": False}

        except Exception as e:
            print(f"Token validation failed: {str(e)}")
            # Token verification failed
            return {"valid": False, "error": str(e)}

    except Exception as e:
        print(f"Validation error: {str(e)}")
        return {"valid": False, "error": f"Validation error: {str(e)}"}
