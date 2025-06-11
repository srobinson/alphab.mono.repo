from typing import Any, Dict, Optional

from alphab_logto.exceptions import TokenError
from alphab_logto.models import LogtoAuthConfig, TokenData, UserInfo
from alphab_logto.services.logging_service import LoggingService
from alphab_logto.services.token_service import TokenService
from alphab_logto.utils.pkce import PKCEUtils
from fastapi import HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse


class AuthService:
    """
    Service for authentication operations.

    This service provides methods for handling authentication flows.
    """

    def __init__(
        self,
        pkce_utils: PKCEUtils,
        token_service: TokenService,
        logging_service: LoggingService,
        config: LogtoAuthConfig,
    ):
        """
        Initialize the authentication service.
        """
        self.pkce_utils = pkce_utils
        self.token_service = token_service
        self.logging_service = logging_service
        self.config = config

    async def initiate_signin(self, request: Request) -> RedirectResponse:
        """
        Handle the sign-in initiation logic.
        """
        callback_uri = self.config.redirect_uri
        code_verifier = self.pkce_utils.generate_code_verifier()
        code_challenge = self.pkce_utils.generate_code_challenge(code_verifier)

        auth_url = (
            f"{self.config.endpoint}/oidc/auth?"
            f"client_id={self.config.app_id}&"
            f"response_type=code&"
            f"redirect_uri={callback_uri}&"
            "scope=openid+profile+email+offline_access&"
            "prompt=login&"
            f"code_challenge={code_challenge}&"
            "code_challenge_method=S256"
        )

        # If a resource is configured, add it to the auth URL to request a JWT
        if self.config.resource:
            auth_url += f"&resource={self.config.resource}"

        response = RedirectResponse(url=auth_url)
        self._set_code_verifier_cookie(response, code_verifier)

        await self.logging_service.log_auth_event(
            request=request,
            event_type="signin_initiation",
            details="User redirected to Logto for authentication",
        )

        return response

    async def handle_callback(
        self,
        request: Request,
        code: Optional[str] = None,
        error: Optional[str] = None,
        error_description: Optional[str] = None,
    ) -> Response:
        """
        Handle the authentication callback logic.
        """
        if error:
            error_msg = f"Authentication error: {error}"
            if error_description:
                error_msg += f" - {error_description}"
            await self.logging_service.log_auth_event(
                request=request, event_type="authentication", success=False, details=error_msg
            )
            frontend_url = self.config.cors_origins[0] if self.config.cors_origins else "/"
            return RedirectResponse(url=f"{frontend_url}?error={error}")

        if not code:
            await self.logging_service.log_auth_event(
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
            code_verifier = request.cookies.get("code_verifier")
            if not code_verifier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No code verifier found. Please try signing in again.",
                )

            tokens = await self.token_service.exchange_code_for_tokens(
                code=code,
                code_verifier=code_verifier,
                redirect_uri=self.config.redirect_uri,
            )
            await self.logging_service.log_auth_event(
                request=request,
                event_type="authentication",
                success=True,
                details="User authenticated via Logto",
            )

            frontend_url = self.config.cors_origins[0] if self.config.cors_origins else "/"
            redirect_url = f"{frontend_url}/auth/callback?token={tokens.access_token}"
            if tokens.refresh_token:
                redirect_url += f"&refresh_token={tokens.refresh_token}"

            response = RedirectResponse(url=redirect_url)
            response.delete_cookie("code_verifier")
            return response
        except Exception as e:
            await self.logging_service.log_auth_event(
                request=request,
                event_type="authentication",
                success=False,
                details=f"Authentication error: {str(e)}",
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication error: {str(e)}",
            )

    async def handle_signout(self, request: Request) -> Response:
        """
        Handle the sign-out logic.
        """
        frontend_url = self.config.cors_origins[0] if self.config.cors_origins else "/"
        try:
            user_id = None
            authorization = request.headers.get("Authorization")
            if authorization:
                try:
                    scheme, token = authorization.split()
                    if scheme.lower() == "bearer":
                        if len(token.split(".")) == 3:
                            payload = await self.token_service.validate_jwt(token)
                            user_id = payload.get("sub")
                        else:
                            user_info = await self.token_service.get_user_info_from_token(token)
                            user_id = user_info.get("sub")
                except TokenError:
                    pass  # Token is invalid, proceed without user_id
            await self.logging_service.log_auth_event(
                request=request,
                event_type="signout",
                user_id=user_id,
                success=True,
                details="User signed out",
            )
        except Exception as e:
            await self.logging_service.log_auth_event(
                request=request,
                event_type="signout",
                success=False,
                details=f"Sign-out error: {str(e)}",
            )
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_303_SEE_OTHER)

    async def get_user_info(self, request: Request, token_data: TokenData) -> UserInfo:
        """
        Get information about the current user by calling the userinfo endpoint.
        """
        authorization = request.headers.get("Authorization")
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization scheme")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format")

        try:
            # Fetch the full user profile from Logto's userinfo endpoint
            payload = await self.token_service.get_user_info_from_token(token)
            return UserInfo(
                sub=payload.get("sub", token_data.sub),
                name=payload.get("name"),
                email=payload.get("email"),
                picture=payload.get("picture"),
                roles=payload.get("roles", token_data.roles),
                username=payload.get("username"),
                email_verified=payload.get("email_verified"),
                created_at=payload.get("created_at"),
                updated_at=payload.get("updated_at"),
            )
        except TokenError as e:
            self.logging_service.log_error(e)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
        except Exception as e:
            self.logging_service.log_error(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching user information"
            )

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh the access token.
        """
        tokens = await self.token_service.refresh_token(refresh_token)
        return {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token or refresh_token,
            "token_type": tokens.token_type,
            "expires_in": tokens.expires_in,
        }

    def _set_code_verifier_cookie(self, response: Response, code_verifier: str) -> None:
        """
        Set the code verifier cookie.
        """
        secure = self.config.cors_origins[0].startswith("https") if self.config.cors_origins else False
        response.set_cookie(
            key="code_verifier",
            value=code_verifier,
            httponly=True,
            secure=secure,
            max_age=600,
        )
