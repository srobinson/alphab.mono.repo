import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import httpx

# Create a global HTTP client with connection pooling
http_client = httpx.AsyncClient(
    timeout=10.0,
    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
)
from app.core.config import settings
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from jose import JWTError, jwt
from pydantic import BaseModel, Field


# Custom error classes for authentication
class AuthenticationError(Exception):
    """Base class for authentication errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class TokenVerificationError(AuthenticationError):
    """Error during token verification."""

    pass


class UserInfoError(AuthenticationError):
    """Error getting user info."""

    pass


# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def is_rate_limited(self, ip_address: str) -> bool:
        """Check if the IP address is rate limited."""
        now = time.time()
        minute_ago = now - 60

        # Remove requests older than 1 minute
        self.requests[ip_address] = [t for t in self.requests[ip_address] if t > minute_ago]

        # Check if the number of requests in the last minute exceeds the limit
        if len(self.requests[ip_address]) >= self.requests_per_minute:
            return True

        # Add the current request
        self.requests[ip_address].append(now)
        return False


# Create a rate limiter instance
rate_limiter = RateLimiter()


# Rate limiting dependency
async def check_rate_limit(request: Request):
    """Check if the request is rate limited."""
    ip_address = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(ip_address):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )


class LogtoSettings(BaseModel):
    """Logto configuration settings."""

    endpoint: str = Field(..., description="Logto endpoint URL")
    app_id: str = Field(..., description="Logto application ID")
    app_secret: str = Field(..., description="Logto application secret")
    token_endpoint: str = ""
    jwks_uri: str = ""
    issuer: str = ""
    audience: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        # Construct derived fields if not provided
        if not self.token_endpoint:
            self.token_endpoint = f"{self.endpoint}/oidc/token"
        if not self.jwks_uri:
            self.jwks_uri = f"{self.endpoint}/oidc/jwks"
        if not self.issuer:
            self.issuer = self.endpoint
        if not self.audience:
            self.audience = self.app_id


# Initialize Logto settings from environment variables
logto_settings = LogtoSettings(
    endpoint=settings.LOGTO_ENDPOINT,
    app_id=settings.LOGTO_APP_ID,
    app_secret=settings.LOGTO_APP_SECRET,
)

print("logto_settings", logto_settings)

# Cache for JWKS
_jwks_cache = None
_jwks_cache_time = None
_jwks_cache_ttl = timedelta(hours=24)  # Cache JWKS for 24 hours


async def get_jwks():
    """Get JWKS from Logto with caching."""
    global _jwks_cache, _jwks_cache_time

    # Check if cache is valid
    if _jwks_cache and _jwks_cache_time and datetime.utcnow() - _jwks_cache_time < _jwks_cache_ttl:
        print("Using cached JWKS")
        return _jwks_cache

    # Fetch JWKS from Logto
    print("Fetching JWKS from Logto")
    try:
        jwks_response = await http_client.get(logto_settings.jwks_uri)

        if not jwks_response.status_code == 200:
            print(f"Failed to fetch JWKS: {jwks_response.status_code} - {jwks_response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch JWKS",
            )

        jwks = jwks_response.json()
        if not jwks:
            print("Empty JWKS response")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Empty JWKS response",
            )

        _jwks_cache = jwks
        _jwks_cache_time = datetime.utcnow()
        return _jwks_cache

    except Exception as e:
        print(f"Failed to fetch JWKS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch JWKS",
        )


class TokenData(BaseModel):
    """JWT token data."""

    sub: str
    roles: List[str] = []
    exp: Optional[datetime] = None


# Custom OAuth2 scheme that handles CORS preflight requests
class CustomOAuth2PasswordBearer(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        # Handle OPTIONS requests for CORS preflight
        if request.method == "OPTIONS":
            return None

        # Get the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None

        # Parse the Authorization header
        scheme, param = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None

        return param


# OAuth2 scheme for token authentication
oauth2_scheme = CustomOAuth2PasswordBearer(tokenUrl="auth/token")


async def get_user_info(token: str) -> Dict:
    """
    Get user info directly from Logto using the token.

    This is the core authentication function that validates tokens by calling
    Logto's userinfo endpoint. The endpoint will validate the token and return
    user information if the token is valid, or return an error if it's not.

    Returns a dictionary with user information that mimics the structure of a JWT payload.
    """
    try:
        print(f"Getting user info from Logto with token: {token[:10]}...")

        # Call Logto's userinfo endpoint
        try:
            userinfo_response = await http_client.get(
                f"{logto_settings.endpoint}/oidc/me", headers={"Authorization": f"Bearer {token}"}
            )

            if userinfo_response.status_code != 200:
                print(
                    f"Failed to get user info from Logto: {userinfo_response.status_code} - {userinfo_response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info from Logto",
                )

            user_info = userinfo_response.json()
            print(f"Got user info from Logto: {user_info}")

            if not user_info:
                raise UserInfoError("Empty user info response from Logto")

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
                raise UserInfoError("Missing subject in user info")

            return payload

        except Exception as e:
            print(f"Error calling Logto userinfo endpoint: {str(e)}")
            raise UserInfoError(f"Failed to get user info from Logto: {str(e)}")

    except AuthenticationError as e:
        # Re-raise authentication errors
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )
    except Exception as e:
        print(f"Error getting user info from Logto: {str(e)}")
        raise UserInfoError(f"Failed to authenticate: {str(e)}")


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> TokenData:
    """Get current user from the token."""
    # Handle OPTIONS requests or missing token
    if token is None:
        raise AuthenticationError(
            "Not authenticated",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    payload = await get_user_info(token)

    # Extract user ID from subject claim
    sub = payload.get("sub")
    if not sub:
        raise TokenVerificationError("Invalid token: missing subject")

    # Extract user roles if available
    roles = payload.get("roles", [])

    # Get token expiration if available
    exp = None
    if "exp" in payload:
        exp = datetime.fromtimestamp(payload["exp"])

    return TokenData(sub=sub, roles=roles, exp=exp)


def has_role(required_roles: List[str]):
    """Dependency for role-based access control."""

    async def role_checker(token_data: TokenData = Depends(get_current_user)):
        # If no roles are required, allow access
        if not required_roles:
            return token_data

        # Check if user has any of the required roles
        for role in required_roles:
            if role in token_data.roles:
                return token_data

        # User doesn't have the required roles
        raise AuthenticationError(
            "Not enough permissions",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return role_checker


# Token handling functions
async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new access token for internal use."""
    to_encode = data.copy()

    # Set token expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})

    # Sign token with app secret
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    return encoded_jwt


# Audit logging function
async def log_auth_event(
    request: Request,
    event_type: str,
    user_id: Optional[str] = None,
    success: bool = True,
    details: Optional[str] = None,
) -> None:
    """Log authentication events for audit purposes."""
    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("User-Agent"),
        "success": success,
        "details": details,
    }

    # In a production system, you would send this to a proper logging service
    # For now, we'll just print it
    print(f"AUTH EVENT: {event}")
