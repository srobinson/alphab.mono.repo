from typing import Any, Dict, Optional, Union

from fastapi import HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from logto_auth.exceptions import AuthError, TokenError
from logto_auth.models import LogtoAuthConfig, TokenData, UserInfo
from logto_auth.services.logging_service import LoggingService
from logto_auth.services.token_service import TokenService
from logto_auth.utils.pkce import PKCEUtils


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

        Args:
            pkce_utils (PKCEUtils): PKCE utilities.
            token_service (TokenService): Token service.
            logging_service (LoggingService): Logging service.
            config (LogtoAuthConfig): Authentication configuration.
        """
        self.pkce_utils = pkce_utils
        self.token_service = token_service
        self.logging_service = logging_service
        self.config = config

    async def initiate_signin(self, request: Request) -> RedirectResponse:
        """
        Handle the sign-in initiation logic.

        Args:
            request (Request): The request object.

        Returns:
            RedirectResponse: Redirect response to the authentication provider.
        """
        # Use provided redirect URI or fallback to the configured one
        callback_uri = self.config.redirect_uri

        # Generate PKCE code verifier and challenge
        code_verifier = self.pkce_utils.generate_code_verifier()
        code_challenge = self.pkce_utils.generate_code_challenge(code_verifier)

        # Construct the Logto authorization URL
        auth_url = (
            f"{self.config.endpoint}/oidc/auth?"
            f"client_id={self.config.app_id}&"
            f"response_type=code&"
            f"redirect_uri={callback_uri}&"
            "scope=openid+profile+email+offline_access&"
            "prompt=login&"  # Always show the login form
            f"code_challenge={code_challenge}&"
            "code_challenge_method=S256"
        )

        # Create response with cookies
        response = RedirectResponse(url=auth_url)
        self._set_code_verifier_cookie(response, code_verifier)

        # Handle redirect URI if provided
        redirect_uri = request.query_params.get("redirectUri")
        if redirect_uri:
            self._set_redirect_cookie(response, redirect_uri)

        # Log the event
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

        Args:
            request (Request): The request object.
            code (Optional[str]): The authorization code.
            error (Optional[str]): Error from the authentication provider.
            error_description (Optional[str]): Error description.

        Returns:
            Response: Response to the client.

        Raises:
            HTTPException: If there's an error during the callback handling.
        """
        # Check for errors from Logto
        if error:
            error_msg = f"Authentication error: {error}"
            if error_description:
                error_msg += f" - {error_description}"

            # Log the error
            await self.logging_service.log_auth_event(
                request=request,
                event_type="authentication",
                success=False,
                details=error_msg,
            )

            # Redirect to frontend with error
            frontend_url = (
                self.config.cors_origins[0] if self.config.cors_origins else "/"
            )
            return RedirectResponse(url=f"{frontend_url}?error={error}")

        # Ensure code is provided
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
            # Get the code verifier from the cookie
            code_verifier = request.cookies.get("code_verifier")
            if not code_verifier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No code verifier found. Please try signing in again.",
                )

            # Exchange the authorization code for tokens
            tokens = await self.token_service.exchange_code_for_tokens(
                code=code,
                code_verifier=code_verifier,
                redirect_uri=self.config.redirect_uri,
            )

            # Get user info from token
            user_info = await self.token_service.get_user_info_from_token(
                tokens.access_token
            )

            # Log the successful authentication
            await self.logging_service.log_auth_event(
                request=request,
                event_type="authentication",
                user_id=user_info.get("sub"),
                success=True,
                details="User authenticated via Logto",
            )

            # Get the post-login redirect URI from the cookie if available
            post_login_redirect = request.cookies.get("post_login_redirect", "/")

            # Get the first CORS origin as the frontend URL
            frontend_url = (
                self.config.cors_origins[0] if self.config.cors_origins else "/"
            )

            # Make sure we're using the correct path for the callback
            # The frontend expects the callback at /auth/callback
            redirect_url = f"{frontend_url}/auth/callback?token={tokens.access_token}"
            if tokens.refresh_token:
                redirect_url += f"&refresh_token={tokens.refresh_token}"

            # Create response and clear cookies
            response = RedirectResponse(url=redirect_url)
            response.delete_cookie("code_verifier")
            response.delete_cookie("post_login_redirect")

            return response

        except Exception as e:
            # Log the error
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

        Args:
            request (Request): The request object.

        Returns:
            Response: Response to the client.
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
                            user_info = (
                                await self.token_service.get_user_info_from_token(token)
                            )
                            user_id = user_info.get("sub")
                        except:
                            # If token verification fails, continue without user_id
                            pass
                except:
                    # If parsing fails, continue without user_id
                    pass

            # Log the sign-out
            await self.logging_service.log_auth_event(
                request=request,
                event_type="signout",
                user_id=user_id,
                success=True,
                details="User signed out",
            )

            # Redirect to the frontend
            frontend_url = (
                self.config.cors_origins[0] if self.config.cors_origins else "/"
            )
            return RedirectResponse(
                url=frontend_url, status_code=status.HTTP_303_SEE_OTHER
            )

        except Exception as e:
            # Log the error
            await self.logging_service.log_auth_event(
                request=request,
                event_type="signout",
                user_id=None,
                success=False,
                details=f"Sign-out error: {str(e)}",
            )

            # Still redirect to frontend even on error
            frontend_url = (
                self.config.cors_origins[0] if self.config.cors_origins else "/"
            )
            return RedirectResponse(
                url=frontend_url, status_code=status.HTTP_303_SEE_OTHER
            )

    async def get_user_info(self, request: Request, token_data: TokenData) -> UserInfo:
        """
        Get information about the current user.

        Args:
            request (Request): The request object.
            token_data (TokenData): The token data.

        Returns:
            UserInfo: The user information.
        """
        try:
            # Get the token from the Authorization header
            authorization = request.headers.get("Authorization")
            if not authorization:
                return UserInfo(
                    sub=token_data.sub,
                    roles=token_data.roles,
                    name=None,
                    email=None,
                    picture=None,
                    username=None,
                    email_verified=None,
                    created_at=None,
                    updated_at=None,
                    custom_claims=None,
                )

            # Parse the Authorization header
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return UserInfo(
                    sub=token_data.sub,
                    roles=token_data.roles,
                    name=None,
                    email=None,
                    picture=None,
                    username=None,
                    email_verified=None,
                    created_at=None,
                    updated_at=None,
                    custom_claims=None,
                )

            # Get user info from Logto
            payload = await self.token_service.get_user_info_from_token(token)

            # Return the user info
            return UserInfo(
                sub=payload.get("sub", token_data.sub),
                name=payload.get("name"),
                email=payload.get("email"),
                picture=payload.get("picture"),
                roles=token_data.roles,
                username=payload.get("username"),
                email_verified=payload.get("email_verified"),
                created_at=payload.get("created_at"),
                updated_at=payload.get("updated_at"),
                custom_claims=None,
            )
        except Exception as e:
            self.logging_service.log_error(e)
            # Fallback to basic user info
            return UserInfo(
                sub=token_data.sub,
                roles=token_data.roles,
                name=None,
                email=None,
                picture=None,
                username=None,
                email_verified=None,
                created_at=None,
                updated_at=None,
                custom_claims=None,
            )

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh the access token.

        Args:
            refresh_token (str): The refresh token.

        Returns:
            Dict[str, Any]: The new tokens.

        Raises:
            TokenError: If the token refresh fails.
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

        Args:
            response (Response): The response object.
            code_verifier (str): The code verifier.
        """
        secure = False
        if self.config.cors_origins:
            secure = self.config.cors_origins[0].startswith("https")

        response.set_cookie(
            key="code_verifier",
            value=code_verifier,
            httponly=True,
            secure=secure,
            max_age=600,  # 10 minutes
        )

    def _set_redirect_cookie(self, response: Response, redirect_uri: str) -> None:
        """
        Set the redirect cookie.

        Args:
            response (Response): The response object.
            redirect_uri (str): The redirect URI.
        """
        secure = False
        if self.config.cors_origins:
            secure = self.config.cors_origins[0].startswith("https")

        response.set_cookie(
            key="post_login_redirect",
            value=redirect_uri,
            httponly=True,
            secure=secure,
            max_age=600,  # 10 minutes
        )
