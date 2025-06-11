from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class LogtoAuthConfig(BaseModel):
    """Configuration for Logto authentication."""

    endpoint: str = Field(..., description="Logto endpoint URL")
    app_id: str = Field(..., description="Logto application ID")
    app_secret: str = Field(..., description="Logto application secret")
    resource: Optional[str] = Field(None, description="The API resource indicator (audience) for JWTs.")
    redirect_uri: str = Field(
        ..., description="Redirect URI for authentication callback"
    )
    jwt_secret_key: str = Field(..., description="Secret key for JWT signing")
    jwt_algorithm: str = Field("HS256", description="Algorithm for JWT signing")
    access_token_expire_minutes: int = Field(
        30, description="Access token expiration time in minutes"
    )
    cors_origins: List[str] = Field([], description="Allowed CORS origins")
    rate_limit_requests_per_minute: int = Field(
        60, description="Maximum requests per minute for rate limiting"
    )
    enable_rate_limiting: bool = Field(
        True, description="Whether to enable rate limiting"
    )

    # Derived fields
    token_endpoint: Optional[str] = Field(None, description="Logto token endpoint")
    jwks_uri: Optional[str] = Field(None, description="Logto JWKS URI")
    issuer: Optional[str] = Field(None, description="Logto issuer")
    audience: Optional[str] = Field(None, description="Logto audience")

    class Config:
        """Pydantic model configuration."""

        extra = "ignore"

    @validator("token_endpoint", always=True)
    def set_token_endpoint(cls, v, values):
        """Set the token endpoint if not provided."""
        if v is None and "endpoint" in values:
            return f"{values['endpoint']}/oidc/token"
        return v

    @validator("jwks_uri", always=True)
    def set_jwks_uri(cls, v, values):
        """Set the JWKS URI if not provided."""
        if v is None and "endpoint" in values:
            return f"{values['endpoint']}/oidc/jwks"
        return v

    @validator("issuer", always=True)
    def set_issuer(cls, v, values):
        """Set the issuer if not provided."""
        if v is None and "endpoint" in values:
            return values["endpoint"]
        return v

    @validator("audience", always=True)
    def set_audience(cls, v, values):
        """Set the audience if not provided."""
        if v is None and "app_id" in values:
            return values["app_id"]
        return v


class TokenData(BaseModel):
    """JWT token data."""

    sub: str = Field(..., description="Subject (user ID)")
    roles: List[str] = Field([], description="User roles")
    exp: Optional[datetime] = Field(None, description="Expiration time")

    class Config:
        """Pydantic model configuration."""

        json_encoders = {datetime: lambda dt: int(dt.timestamp())}


class UserInfo(BaseModel):
    """User information model."""

    sub: str = Field(..., description="Subject (user ID)")
    name: Optional[str] = Field(None, description="User's full name")
    email: Optional[str] = Field(None, description="User's email address")
    picture: Optional[str] = Field(None, description="URL to user's profile picture")
    roles: List[str] = Field([], description="User roles")
    username: Optional[str] = Field(None, description="User's username")
    email_verified: Optional[bool] = Field(
        None, description="Whether the email is verified"
    )
    created_at: Optional[int] = Field(None, description="User creation timestamp")
    updated_at: Optional[int] = Field(None, description="User update timestamp")
    custom_claims: Optional[Dict[str, Any]] = Field(
        None, description="Custom user claims"
    )

    class Config:
        """Pydantic model configuration."""

        extra = "ignore"


class TokenResponse(BaseModel):
    """Token response model."""

    access_token: str = Field(..., description="Access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    refresh_token: Optional[str] = Field(None, description="Refresh token")

    class Config:
        """Pydantic model configuration."""

        extra = "ignore"


class StandardResponse(BaseModel):
    """Standard response model for all API endpoints."""

    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    errors: Optional[List[Dict[str, Any]]] = Field(None, description="Error details")

    class Config:
        """Pydantic model configuration."""

        extra = "ignore"
