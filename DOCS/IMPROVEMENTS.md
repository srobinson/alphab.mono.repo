# Authentication System Improvements

After reviewing the authentication system, I've identified several areas for improvement to make the code more robust, maintainable, and secure.

## Frontend Improvements

### 1. Enhance User Interface in authClient.ts

The current User interface doesn't include all the fields we're getting from the backend:

```typescript
// Current
export interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
  roles: string[];
}

// Improved
export interface User {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
  roles: string[];
  username?: string;
  email_verified?: boolean;
  created_at?: number;
  updated_at?: number;
}
```

### 2. Add Token Expiration Checking

Add a method to check if the token is expired:

```typescript
isTokenExpired(): boolean {
  if (!this.accessToken) {
    return true;
  }

  try {
    // Decode the token without verification to get the expiration time
    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
    if (!payload.exp) {
      return false;
    }

    // Check if the token is expired
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}
```

### 3. Implement Token Refresh

Add a method to refresh the token when it's about to expire:

```typescript
async refreshToken(): Promise<boolean> {
  if (!this.accessToken) {
    return false;
  }

  try {
    const response = await fetch(getApiUrl('/api/v1/auth/refresh'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.isAuthenticated = true;
    this.saveToStorage();

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}
```

### 4. Improve Error Handling

Enhance error handling for network issues and other failures:

```typescript
// Add a custom error class for authentication errors
class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Use the custom error class in the authentication methods
async refreshUser(): Promise<void> {
  if (!this.accessToken) {
    this.clearStorage();
    return;
  }

  try {
    // Call the backend's session endpoint
    const response = await fetch(getApiUrl('/api/v1/auth/session'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthError(
        `Failed to get session info: ${response.status}`,
        'session_fetch_failed'
      );
    }

    // Rest of the method...
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(`Authentication error (${error.code}):`, error.message);
    } else {
      console.error('Error refreshing user:', error);
    }
    this.clearStorage();
  }
}
```

### 5. Add Automatic Token Refresh

Implement automatic token refresh before making authenticated requests:

```typescript
async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  if (!this.isAuthenticated || !this.accessToken) {
    throw new AuthError('User is not authenticated', 'not_authenticated');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  if (this.isTokenExpired()) {
    // Try to refresh the token
    const refreshed = await this.refreshToken();
    if (!refreshed) {
      throw new AuthError('Failed to refresh token', 'token_refresh_failed');
    }
  }

  // Add the Authorization header
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${this.accessToken}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // Return the fetch promise
  return fetch(getApiUrl(url), {
    ...options,
    headers,
    credentials: 'include',
    mode: 'cors',
  });
}
```

## Backend Improvements

### 1. Replace Debug Prints with Proper Logging

Replace the numerous print statements with a proper logging system:

```python
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Replace print statements with logger calls
# Example:
# print(f"Verifying token: {token[:10]}...")
logger.debug(f"Verifying token: {token[:10]}...")

# print(f"JWT error: {str(e)}")
logger.error(f"JWT error: {str(e)}")
```

### 2. Enhance get_user_info_from_logto Function

Update the function to include all fields from Logto:

```python
async def get_user_info_from_logto(token: str) -> Dict:
    """Get user info directly from Logto using the token."""
    try:
        logger.debug(f"Getting user info from Logto with token: {token[:10]}...")

        # Call Logto's userinfo endpoint
        async with httpx.AsyncClient() as client:
            userinfo_response = await client.get(
                f"{logto_settings.endpoint}/oidc/me",
                headers={"Authorization": f"Bearer {token}"}
            )

            if userinfo_response.status_code != 200:
                logger.error(f"Failed to get user info from Logto: {userinfo_response.status_code} - {userinfo_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get user info from Logto",
                )

            user_info = userinfo_response.json()
            logger.debug(f"Got user info from Logto: {user_info}")

            # Create a payload with all fields from Logto
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

            return payload

    except Exception as e:
        logger.exception(f"Error getting user info from Logto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to authenticate: {str(e)}",
        )
```

### 3. Add JWKS Caching

Implement caching for the JWKS to improve performance:

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Cache for JWKS
_jwks_cache = None
_jwks_cache_time = None
_jwks_cache_ttl = timedelta(hours=24)  # Cache JWKS for 24 hours

async def get_jwks():
    """Get JWKS from Logto with caching."""
    global _jwks_cache, _jwks_cache_time

    # Check if cache is valid
    if _jwks_cache and _jwks_cache_time and datetime.utcnow() - _jwks_cache_time < _jwks_cache_ttl:
        logger.debug("Using cached JWKS")
        return _jwks_cache

    # Fetch JWKS from Logto
    logger.debug("Fetching JWKS from Logto")
    async with httpx.AsyncClient() as client:
        jwks_response = await client.get(logto_settings.jwks_uri)
        if not jwks_response.status_code == 200:
            logger.error(f"Failed to fetch JWKS: {jwks_response.status_code} - {jwks_response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch JWKS",
            )

        _jwks_cache = jwks_response.json()
        _jwks_cache_time = datetime.utcnow()
        return _jwks_cache
```

### 4. Improve Error Handling

Enhance error handling with more specific error types:

```python
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

# Use the custom error classes in the authentication functions
async def verify_token(token: str) -> Dict:
    """Verify the JWT token issued by Logto."""
    try:
        # ... existing code ...
    except JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        # Try to get user info directly from Logto
        return await get_user_info_from_logto(token)
    except Exception as e:
        logger.exception(f"Unexpected error in verify_token: {str(e)}")
        raise TokenVerificationError(f"Token verification error: {str(e)}")
```

### 5. Add Rate Limiting

Implement rate limiting for authentication endpoints to prevent abuse:

```python
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from jose import JWTError, jwt
from pydantic import BaseModel, Field
import time
from collections import defaultdict

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

# Add rate limiting to authentication endpoints
async def check_rate_limit(request: Request):
    """Check if the request is rate limited."""
    ip_address = request.client.host
    if rate_limiter.is_rate_limited(ip_address):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )
```

## Security Improvements

### 1. Use HTTP-Only Cookies for Token Storage

Instead of storing tokens in localStorage, use HTTP-only cookies for better security:

```python
# Backend: Set the token in an HTTP-only cookie
@router.get("/callback")
async def callback(request: Request, response: Response, ...):
    # ... existing code ...

    # Set the token in an HTTP-only cookie
    response = RedirectResponse(url=redirect_url)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"),
        samesite="lax",
        max_age=3600,  # 1 hour
    )

    return response
```

```typescript
// Frontend: Update the authClient to use cookies
class AuthClient {
  // ... existing code ...

  // Get the access token from cookies
  getAccessToken(): string | null {
    // The token is stored in an HTTP-only cookie, so we can't access it directly
    // Instead, we rely on the isAuthenticated flag
    return this.isAuthenticated ? "token_in_cookie" : null;
  }

  // Refresh user data from server
  async refreshUser(): Promise<void> {
    try {
      // Call the backend's session endpoint
      const response = await fetch(getApiUrl("/api/v1/auth/session"), {
        method: "GET",
        credentials: "include", // Include cookies
        mode: "cors",
      });

      // ... rest of the method ...
    } catch (error) {
      // ... error handling ...
    }
  }

  // Fetch data with authentication
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated) {
      throw new Error("User is not authenticated");
    }

    // Return the fetch promise
    return fetch(getApiUrl(url), {
      ...options,
      credentials: "include", // Include cookies
      mode: "cors",
    });
  }
}
```

### 2. Implement CSRF Protection

Add CSRF protection for authentication endpoints:

```python
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from jose import JWTError, jwt
from pydantic import BaseModel, Field
import secrets

# Generate a CSRF token
def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    return secrets.token_hex(32)

# Verify the CSRF token
def verify_csrf_token(request: Request, csrf_token: str) -> bool:
    """Verify the CSRF token."""
    stored_token = request.cookies.get("csrf_token")
    return stored_token == csrf_token

# Add CSRF protection to authentication endpoints
@router.post("/signin")
async def signin(request: Request, response: Response, csrf_token: str = Form(...)):
    """
    Initiate the Logto sign-in flow.
    """
    # Verify the CSRF token
    if not verify_csrf_token(request, csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )

    # ... rest of the method ...
```

## Performance Improvements

### 1. Optimize Token Verification

Optimize the token verification process by caching JWKS and minimizing network requests:

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Cache for JWKS
_jwks_cache = None
_jwks_cache_time = None
_jwks_cache_ttl = timedelta(hours=24)  # Cache JWKS for 24 hours

async def get_jwks():
    """Get JWKS from Logto with caching."""
    global _jwks_cache, _jwks_cache_time

    # Check if cache is valid
    if _jwks_cache and _jwks_cache_time and datetime.utcnow() - _jwks_cache_time < _jwks_cache_ttl:
        logger.debug("Using cached JWKS")
        return _jwks_cache

    # Fetch JWKS from Logto
    logger.debug("Fetching JWKS from Logto")
    async with httpx.AsyncClient() as client:
        jwks_response = await client.get(logto_settings.jwks_uri)
        if not jwks_response.status_code == 200:
            logger.error(f"Failed to fetch JWKS: {jwks_response.status_code} - {jwks_response.text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch JWKS",
            )

        _jwks_cache = jwks_response.json()
        _jwks_cache_time = datetime.utcnow()
        return _jwks_cache
```

### 2. Implement Connection Pooling for HTTP Requests

Use connection pooling for HTTP requests to improve performance:

```python
import httpx

# Create a global HTTP client with connection pooling
http_client = httpx.AsyncClient(
    timeout=10.0,
    limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
)

# Use the global HTTP client for requests
async def get_user_info_from_logto(token: str) -> Dict:
    """Get user info directly from Logto using the token."""
    try:
        logger.debug(f"Getting user info from Logto with token: {token[:10]}...")

        # Call Logto's userinfo endpoint
        userinfo_response = await http_client.get(
            f"{logto_settings.endpoint}/oidc/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        # ... rest of the method ...
    except Exception as e:
        # ... error handling ...
```

## Conclusion

These improvements will make the authentication system more robust, maintainable, and secure. They address issues with error handling, performance, security, and code quality. Implementing these changes will result in a more reliable and efficient authentication system.
