import base64
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

import httpx
from logto_auth.exceptions import ConfigurationError, TokenError
from logto_auth.models import LogtoAuthConfig, TokenData, TokenResponse
from logto_auth.services.logging_service import LoggingService
from logto_auth.utils.http_client import HttpClientManager


class TokenService:
    """
    Service for token operations.

    This service provides methods for token generation, validation, and exchange.
    """

    def __init__(
        self,
        config: LogtoAuthConfig,
        http_client_manager: Optional[HttpClientManager] = None,
        logging_service: Optional[LoggingService] = None,
    ):
        """
        Initialize the token service.

        Args:
            config (LogtoAuthConfig): The authentication configuration.
            http_client_manager (Optional[HttpClientManager]): HTTP client manager.
            logging_service (Optional[LoggingService]): Logging service.
        """
        self.config = config
        self.http_client_manager = http_client_manager or HttpClientManager()
        self.logging_service = logging_service or LoggingService()

    async def exchange_code_for_tokens(
        self, code: str, code_verifier: str, redirect_uri: str
    ) -> TokenResponse:
        """
        Exchange an authorization code for tokens.

        Args:
            code (str): The authorization code.
            code_verifier (str): The PKCE code verifier.
            redirect_uri (str): The redirect URI.

        Returns:
            TokenResponse: The token response.

        Raises:
            TokenError: If the token exchange fails.
        """
        try:
            # Get HTTP client
            client = await self.http_client_manager.get_client()

            # Prepare the data for the token request
            token_data = {
                "client_id": self.config.app_id,
                "client_secret": self.config.app_secret,
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": code_verifier,
            }

            # Add redirect_uri if it's not None
            if redirect_uri:
                token_data["redirect_uri"] = redirect_uri

            # Exchange the authorization code for tokens
            token_endpoint = self.config.token_endpoint
            if not token_endpoint:
                token_endpoint = f"{self.config.endpoint}/oidc/token"

            response = await client.post(
                token_endpoint,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            # Check response status
            if response.status_code != 200:
                error_detail = f"Failed to exchange code for tokens: {response.text}"
                self.logging_service.log_debug(
                    "Token exchange failed",
                    {"status_code": response.status_code, "response": response.text},
                )
                raise TokenError(error_detail)

            # Parse response
            tokens = response.json()

            # Create token response
            return TokenResponse(
                access_token=tokens.get("access_token"),
                token_type=tokens.get("token_type", "bearer"),
                expires_in=tokens.get("expires_in", 3600),
                refresh_token=tokens.get("refresh_token"),
            )
        except httpx.HTTPError as e:
            self.logging_service.log_error(e)
            raise TokenError(f"HTTP error during token exchange: {str(e)}")
        except Exception as e:
            self.logging_service.log_error(e)
            raise TokenError(f"Error exchanging code for tokens: {str(e)}")

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """
        Refresh an access token.

        Args:
            refresh_token (str): The refresh token.

        Returns:
            TokenResponse: The token response.

        Raises:
            TokenError: If the token refresh fails.
        """
        try:
            # Get HTTP client
            client = await self.http_client_manager.get_client()

            # Prepare the data for the token request
            token_data = {
                "client_id": self.config.app_id,
                "client_secret": self.config.app_secret,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            }

            # Exchange the refresh token for a new access token
            token_endpoint = self.config.token_endpoint
            if not token_endpoint:
                token_endpoint = f"{self.config.endpoint}/oidc/token"

            response = await client.post(
                token_endpoint,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            # Check response status
            if response.status_code != 200:
                error_detail = f"Failed to refresh token: {response.text}"
                self.logging_service.log_debug(
                    "Token refresh failed",
                    {"status_code": response.status_code, "response": response.text},
                )
                raise TokenError(error_detail)

            # Parse response
            tokens = response.json()

            # Create token response
            return TokenResponse(
                access_token=tokens.get("access_token"),
                token_type=tokens.get("token_type", "bearer"),
                expires_in=tokens.get("expires_in", 3600),
                refresh_token=tokens.get("refresh_token", refresh_token),
            )
        except httpx.HTTPError as e:
            self.logging_service.log_error(e)
            raise TokenError(f"HTTP error during token refresh: {str(e)}")
        except Exception as e:
            self.logging_service.log_error(e)
            raise TokenError(f"Error refreshing token: {str(e)}")

    async def get_user_info_from_token(self, token: str) -> Dict[str, Any]:
        """
        Get user information from a token.

        Args:
            token (str): The access token.

        Returns:
            Dict[str, Any]: The user information.

        Raises:
            TokenError: If getting user information fails.
        """
        try:
            # Get HTTP client
            client = await self.http_client_manager.get_client()

            # Call Logto's userinfo endpoint
            userinfo_endpoint = f"{self.config.endpoint}/oidc/me"
            response = await client.get(
                userinfo_endpoint, headers={"Authorization": f"Bearer {token}"}
            )

            # Check response status
            if response.status_code != 200:
                error_detail = f"Failed to get user info: {response.text}"
                self.logging_service.log_debug(
                    "User info request failed",
                    {"status_code": response.status_code, "response": response.text},
                )
                raise TokenError(error_detail)

            # Parse response
            user_info = response.json()

            # Create a payload similar to what we'd get from JWT
            payload = {
                "sub": user_info.get("sub"),
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "picture": user_info.get("picture"),
                "roles": user_info.get("roles", []),
                "username": user_info.get("username"),
                "email_verified": user_info.get("email_verified"),
                "created_at": user_info.get("created_at"),
                "updated_at": user_info.get("updated_at"),
            }

            # Ensure sub is present
            if not payload.get("sub"):
                raise TokenError("Missing subject in user info")

            return payload
        except httpx.HTTPError as e:
            self.logging_service.log_error(e)
            raise TokenError(f"HTTP error during user info request: {str(e)}")
        except Exception as e:
            self.logging_service.log_error(e)
            raise TokenError(f"Error getting user info: {str(e)}")
