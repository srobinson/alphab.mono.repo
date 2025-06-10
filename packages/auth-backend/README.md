# Logto Auth for FastAPI

A reusable authentication package for FastAPI applications using Logto as the authentication provider.

## Features

- Complete PKCE authentication flow
- Token management and validation
- User information retrieval
- Role-based access control
- Rate limiting
- Protected App integration
- Comprehensive logging

## Installation

```bash
pip install logto-auth
```

For JWT support, install with the JWT extra:

```bash
pip install logto-auth[jwt]
```

## Quick Start

```python
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

## Authentication Flow

1. User is redirected to `/auth/signin` to initiate the authentication flow
2. User is redirected to Logto for authentication
3. After authentication, Logto redirects back to `/auth/callback`
4. The callback handler exchanges the authorization code for tokens
5. The user is redirected back to the frontend with the tokens

## Protected Routes

You can protect routes using the `get_current_user` dependency:

```python
from fastapi import Depends
from logto_auth.dependencies import get_current_user
from logto_auth.models import TokenData

@app.get("/protected")
async def protected_route(user: TokenData = Depends(get_current_user)):
    return {"message": "This route is protected", "user_id": user.sub}
```

## Role-Based Access Control

You can restrict routes to users with specific roles:

```python
from logto_auth.dependencies import has_role

@app.get("/admin")
async def admin_route(user: TokenData = Depends(has_role(["admin"]))):
    return {"message": "This route is only accessible to admins", "user_id": user.sub}
```

## Rate Limiting

Rate limiting is enabled by default. You can configure it in the `LogtoAuthConfig`:

```python
auth_config = LogtoAuthConfig(
    # ... other config
    enable_rate_limiting=True,
    rate_limit_requests_per_minute=60
)
```

## Protected App Integration

If you're using Logto's Protected App feature, you can validate requests from the Protected App:

```python
from fastapi import FastAPI
from logto_auth import setup_auth, LogtoAuthConfig
from logto_auth.middleware import LogtoProtectedAppMiddleware

app = FastAPI()

# Set up authentication
auth_config = LogtoAuthConfig(
    # ... your config
)

setup_auth(app, auth_config)

# Add Protected App middleware
app.add_middleware(
    LogtoProtectedAppMiddleware,
    app_id=auth_config.app_id,
    app_secret=auth_config.app_secret
)
```

## Configuration Options

The `LogtoAuthConfig` class supports the following options:

- `endpoint`: Logto endpoint URL
- `app_id`: Logto application ID
- `app_secret`: Logto application secret
- `redirect_uri`: Redirect URI for authentication callback
- `jwt_secret_key`: Secret key for JWT signing
- `jwt_algorithm`: Algorithm for JWT signing (default: "HS256")
- `access_token_expire_minutes`: Access token expiration time in minutes (default: 30)
- `cors_origins`: Allowed CORS origins
- `rate_limit_requests_per_minute`: Maximum requests per minute for rate limiting (default: 60)
- `enable_rate_limiting`: Whether to enable rate limiting (default: True)

## License

MIT
