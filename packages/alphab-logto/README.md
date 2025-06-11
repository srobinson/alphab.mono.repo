# @alphab/auth-logto-backend

A reusable Logto authentication package for FastAPI applications.

## Installation

```bash
pip install alphab-auth-logto
```

## Usage

```python
from fastapi import FastAPI
from alphab_logto import setup_auth, LogtoAuthConfig

app = FastAPI()

auth_config = LogtoAuthConfig(
    endpoint="https://your-logto-endpoint.com",
    app_id="your-app-id",
    app_secret="your-app-secret",
    redirect_uri="http://localhost:3000/auth/callback",
    jwt_secret_key="your-jwt-secret",
    cors_origins=["http://localhost:3000"]
)

setup_auth(app, auth_config)
```

## Features

- PKCE-based OAuth2 flow
- JWT token validation
- User session management
- Rate limiting
- Comprehensive error handling

## Development

```bash
# Install dependencies
poetry install

# Run tests
python -m pytest

# Format code
black .
```
