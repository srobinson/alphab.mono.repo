# Authentication Refactoring Strategy

This document outlines a comprehensive strategy for refactoring the authentication system in the alphab monorepo to improve code quality, maintainability, and reusability across multiple projects.

## Current Issues

The current authentication implementation has several issues:

1. **Monolithic Auth Module**: `backend/app/api/v1/endpoints/auth.py` is 639 lines long, handling too many responsibilities (PKCE, token management, user info, session management, etc.).

2. **Debug Statements in Production Code**: Numerous `print()` statements throughout the auth code that should be replaced with proper logging.

3. **Inconsistent Error Handling**: Some errors are logged and returned as HTTP exceptions, while others are just printed to console.

4. **Security Concerns**:

   - Storing code verifier in cookies without proper security considerations
   - Exposing detailed error messages to clients
   - No rate limiting on authentication endpoints

5. **Duplicated Logic**: Token validation logic is duplicated across multiple endpoints.

## Proposed Solution: Reusable Auth Packages

Since we're building multiple applications with the same authentication requirements using the same Logto instance, creating reusable auth packages will significantly accelerate development.

### Monorepo Restructuring

```
alphab/
├── packages/
│   ├── auth-backend/          # Reusable Python auth package
│   ├── auth-frontend/         # Reusable React auth package
│   ├── particle0-backend/     # Renamed from backend/
│   ├── particle0-frontend/    # Renamed from frontend/
│   └── other-apps/            # Future applications
├── apps/
│   ├── particle0/             # Main application
│   ├── app2/                  # Another application
│   └── app3/                  # Yet another application
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
├── .gitignore
├── package.json               # Root package.json for monorepo management
└── README.md
```

## Backend Auth Package Implementation

### Package Structure

```
auth-backend/
├── pyproject.toml
├── README.md
├── src/
│   └── logto_auth/
│       ├── __init__.py
│       ├── dependencies.py
│       ├── exceptions.py
│       ├── middleware.py
│       ├── models.py
│       ├── routes.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── auth_service.py
│       │   ├── token_service.py
│       │   └── logging_service.py
│       └── utils/
│           ├── __init__.py
│           ├── http_client.py
│           ├── pkce.py
│           └── rate_limiter.py
└── tests/
    ├── __init__.py
    ├── test_services.py
    └── test_utils.py
```

### Key Components

#### 1. Configuration

```python
# src/logto_auth/__init__.py
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

class LogtoAuthConfig(BaseModel):
    """Configuration for Logto authentication."""
    endpoint: str
    app_id: str
    app_secret: str
    redirect_uri: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: List[str] = []
    rate_limit_requests_per_minute: int = 60
    enable_rate_limiting: bool = True

def setup_auth(app: FastAPI, config: LogtoAuthConfig, prefix: str = "/auth"):
    """
    Set up authentication for a FastAPI application.

    Args:
        app: The FastAPI application
        config: Authentication configuration
        prefix: URL prefix for auth routes
    """
    from logto_auth.routes import router
    from logto_auth.middleware import RateLimitingMiddleware

    # Register middleware
    if config.enable_rate_limiting:
        from logto_auth.utils.rate_limiter import RateLimiter
        rate_limiter = RateLimiter(requests_per_minute=config.rate_limit_requests_per_minute)
        app.add_middleware(
            RateLimitingMiddleware,
            rate_limiter=rate_limiter,
            paths_to_limit=[f"{prefix}/"]
        )

    # Register routes
    app.include_router(router, prefix=prefix)

    # Store config for dependency injection
    app.state.logto_auth_config = config

    return app
```

#### 2. Dependency Injection

```python
# src/logto_auth/dependencies.py
from fastapi import Depends, Request
from logto_auth.services.auth_service import AuthService
from logto_auth.services.token_service import TokenService
from logto_auth.services.logging_service import LoggingService
from logto_auth.utils.pkce import PKCEUtils

def get_config(request: Request):
    """Get the Logto auth configuration."""
    return request.app.state.logto_auth_config

def get_auth_service(config = Depends(get_config)):
    """Get the authentication service."""
    pkce_utils = PKCEUtils()
    token_service = TokenService(config)
    logging_service = LoggingService()
    return AuthService(pkce_utils, token_service, logging_service, config)
```

#### 3. Routes

```python
# src/logto_auth/routes.py
from fastapi import APIRouter, Depends, Request, Response
from logto_auth.dependencies import get_auth_service
from logto_auth.services.auth_service import AuthService

router = APIRouter()

@router.get("/signin")
async def signin(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Initiate the Logto sign-in flow."""
    return await auth_service.initiate_signin(request)

@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle the callback from Logto after user authentication."""
    return await auth_service.handle_callback(
        request, code, error, error_description
    )

# Additional routes for /me, /session, /token, etc.
```

#### 4. Services

```python
# src/logto_auth/services/auth_service.py
from typing import Optional
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse

from logto_auth.utils.pkce import PKCEUtils
from logto_auth.services.token_service import TokenService
from logto_auth.services.logging_service import LoggingService
from logto_auth.models import LogtoAuthConfig

class AuthService:
    def __init__(
        self,
        pkce_utils: PKCEUtils,
        token_service: TokenService,
        logging_service: LoggingService,
        config: LogtoAuthConfig
    ):
        self.pkce_utils = pkce_utils
        self.token_service = token_service
        self.logging_service = logging_service
        self.config = config

    async def initiate_signin(self, request: Request) -> RedirectResponse:
        """Handle the sign-in initiation logic."""
        callback_uri = self.config.redirect_uri

        # Generate PKCE code verifier and challenge
        code_verifier = self.pkce_utils.generate_code_verifier()
        code_challenge = self.pkce_utils.generate_code_challenge(code_verifier)

        # Construct auth URL
        auth_url = self._build_auth_url(code_challenge, callback_uri)

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
            details="User redirected to Logto for authentication"
        )

        return response

    async def handle_callback(
        self,
        request: Request,
        code: Optional[str],
        error: Optional[str],
        error_description: Optional[str]
    ) -> Response:
        """Handle the authentication callback logic."""
        # Implementation details...
```

#### 5. Utilities

```python
# src/logto_auth/utils/pkce.py
import base64
import hashlib
import os

class PKCEUtils:
    def generate_code_verifier(self) -> str:
        """Generate a code verifier for PKCE."""
        code_verifier = base64.urlsafe_b64encode(os.urandom(40)).decode("utf-8")
        return code_verifier.replace("=", "")

    def generate_code_challenge(self, code_verifier: str) -> str:
        """Generate a code challenge from the code verifier."""
        code_challenge = hashlib.sha256(code_verifier.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(code_challenge).decode("utf-8").replace("=", "")
```

#### 6. Error Handling

```python
# src/logto_auth/exceptions.py
from fastapi import HTTPException, status

class AuthError(HTTPException):
    """Base class for authentication errors."""
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: dict = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class TokenError(AuthError):
    """Error related to token operations."""
    pass

class UserInfoError(AuthError):
    """Error related to user information operations."""
    pass

class AuthorizationError(AuthError):
    """Error related to authorization operations."""
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )
```

#### 7. Logging

```python
# src/logto_auth/services/logging_service.py
import logging
from datetime import datetime
from typing import Optional

from fastapi import Request

logger = logging.getLogger("auth")

class LoggingService:
    async def log_auth_event(
        self,
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

        if success:
            logger.info(f"AUTH EVENT: {event}")
        else:
            logger.error(f"AUTH ERROR: {event}")
```

## Frontend Auth Package Implementation

### Package Structure

```
auth-frontend/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── components/
│   │   ├── AuthCallbackHandler.tsx
│   │   ├── AuthStatus.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthProvider.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useProtectedFetch.ts
│   ├── services/
│   │   └── authService.ts
│   └── types/
│       └── index.ts
└── tests/
    ├── components.test.tsx
    └── hooks.test.ts
```

### Key Components

#### 1. Types

```typescript
// src/types/index.ts
export interface AuthConfig {
  apiUrl: string;
  logtoEndpoint: string;
  appId: string;
  redirectUri?: string;
}

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

#### 2. Auth Service

```typescript
// src/services/authService.ts
import { AuthConfig, User } from "../types";

export class AuthService {
  private user: User | null = null;
  private isAuthenticated = false;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // Load user from storage
      const userJson = localStorage.getItem("logto_user");
      if (userJson) {
        this.user = JSON.parse(userJson);
      }

      // Load auth status from storage
      const authStatus = localStorage.getItem("logto_auth_status");
      this.isAuthenticated = authStatus === "true";

      // Load tokens from storage
      this.accessToken = localStorage.getItem("logto_token");
      this.refreshToken = localStorage.getItem("logto_refresh_token");
    } catch (error) {
      console.error("Error loading auth state from storage:", error);
      this.clearStorage();
    }
  }

  // Additional methods for token management, user info, etc.
}
```

#### 3. Auth Provider

```typescript
// src/contexts/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthService } from "../services/authService";
import { User, AuthConfig } from "../types";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  roles: string[];
  signIn: (redirectUri?: string, provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  config: AuthConfig;
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  const [authService] = useState(() => new AuthService(config));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Implementation...
    };

    initAuth();
  }, [authService]);

  // Context value
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    roles,
    signIn: authService.signIn.bind(authService),
    signOut: authService.signOut.bind(authService),
    refreshUser: async () => {
      // Implementation...
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
```

#### 4. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, roles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if required
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
```

## Logto Protected App Integration

Based on the Logto documentation provided, we can also implement support for Logto's Protected App feature, which simplifies authentication by separating the authentication layer from your application.

### Backend Integration for Protected App

```python
# src/logto_auth/middleware.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import base64
import jwt
from jwt.jwks_client import PyJWKClient

class LogtoProtectedAppMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        app_id: str,
        app_secret: str,
        jwks_uri: str = None,
        issuer: str = None
    ):
        super().__init__(app)
        self.app_id = app_id
        self.app_secret = app_secret
        self.jwks_client = PyJWKClient(jwks_uri) if jwks_uri else None
        self.issuer = issuer

    async def dispatch(self, request: Request, call_next):
        # Verify HTTP Basic Authentication
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Basic "):
            credentials = auth_header[6:]
            decoded = base64.b64decode(credentials).decode("utf-8")
            if decoded == f"{self.app_id}:{self.app_secret}":
                # Valid Protected App request
                return await call_next(request)

        # Verify JWT token if available
        id_token = request.headers.get("Logto-ID-Token")
        if id_token and self.jwks_client and self.issuer:
            try:
                signing_key = self.jwks_client.get_signing_key_from_jwt(id_token)
                payload = jwt.decode(
                    id_token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience=self.app_id,
                    issuer=self.issuer
                )
                # Valid token, attach user info to request state
                request.state.user = payload
                return await call_next(request)
            except Exception as e:
                print(f"JWT validation error: {str(e)}")

        # Unauthorized
        return Response(
            content="Unauthorized",
            status_code=401,
            media_type="text/plain"
        )
```

## Implementation Strategy

To implement this refactoring safely:

1. **Create a Feature Branch**: Work on a separate branch to avoid disrupting the main codebase.

2. **Incremental Refactoring**:

   - Start by extracting utility classes (PKCE, token handling)
   - Then create service classes
   - Finally, refactor route handlers to use the new services

3. **Maintain Test Coverage**: Ensure all existing tests pass after each refactoring step.

4. **Add New Tests**: Write unit tests for each new component.

5. **Documentation**: Update API documentation to reflect the new structure.

## Usage Examples

### Backend Usage

```python
# main.py in your project
from fastapi import FastAPI
from logto_auth import setup_auth, LogtoAuthConfig

app = FastAPI()

# Set up authentication
auth_config = LogtoAuthConfig(
    endpoint="https://logto.dev",
    app_id="your-app-id",
    app_secret="your-app-secret",
    redirect_uri="http://localhost:3000/auth/callback",
    jwt_secret_key="your-jwt-secret",
    cors_origins=["http://localhost:3000"]
)

setup_auth(app, auth_config)

# Your application routes
@app.get("/")
async def root():
    return {"message": "Hello World"}
```

### Frontend Usage

```tsx
// App.tsx in your project
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthCallbackHandler, ProtectedRoute } from "auth-frontend";
import HomePage from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LoginPage from "./pages/Login";

const authConfig = {
  apiUrl: "http://localhost:8000/api/v1",
  logtoEndpoint: "https://logto.dev",
  appId: "your-app-id",
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Benefits for AI Assistants

This restructured monorepo with reusable packages will make it much easier for AI assistants to help you develop new applications:

1. **Standardized Authentication**: AI assistants can focus on application-specific logic rather than reimplementing authentication

2. **Clear Structure**: The monorepo structure provides a clear template for new applications

3. **Reduced Complexity**: Authentication complexity is hidden behind simple interfaces

4. **Consistent Patterns**: Consistent patterns across applications make it easier for AI to understand and modify code

5. **Documentation in Code**: The reusable packages serve as self-documenting examples

## Complete Migration to Packages Structure

While the initial focus of this refactoring is on the authentication system, the ultimate goal is to migrate the entire codebase to a packages-based structure. This involves:

1. **Moving all frontend code**: Migrating from `frontend/` to `packages/particle0-frontend/`
2. **Moving all backend code**: Migrating from `backend/` to `packages/particle0-backend/`

### Migration Process

A migration script (`migrate-to-packages.sh`) has been created to automate this process. The script:

1. Copies all files from the original directories to the new package directories
2. Updates imports to use the new package structure
3. Adds dependencies on the auth packages

For detailed instructions on the migration process, see the [Migration Guide](MIGRATION_GUIDE.md).

### Post-Migration Structure

After the complete migration, the project structure will be:

```
alphab/
├── packages/
│   ├── auth-backend/          # Reusable Python auth package
│   ├── auth-frontend/         # Reusable React auth package
│   ├── particle0-backend/     # Main backend application
│   ├── particle0-frontend/    # Main frontend application
│   └── other-apps/            # Future applications
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
├── .gitignore
├── package.json               # Root package.json for monorepo management
└── README.md
```

### Benefits of Complete Migration

Moving the entire codebase to packages provides several additional benefits:

1. **Consistent Structure**: All code follows the same organizational pattern
2. **Easier Onboarding**: New developers can quickly understand the project structure
3. **Simplified Dependency Management**: Dependencies are clearly defined at the package level
4. **Better Isolation**: Each package can be developed and tested independently
5. **Reusable Components**: Common functionality can be extracted into reusable packages
6. **Scalability**: New applications can be added as packages without changing the overall structure

## Conclusion

By refactoring the authentication system into reusable packages and migrating the entire codebase to a packages-based structure, we can significantly improve code quality, maintainability, and development speed across multiple projects. The layered architecture and separation of concerns will make the code easier to understand, test, and extend.

This approach aligns well with the use of Logto as an authentication provider, allowing us to leverage its features while maintaining a clean and modular codebase.

For detailed instructions on implementing the migration, refer to the [Migration Guide](MIGRATION_GUIDE.md).
