from fastapi import FastAPI
from logto_auth import setup_auth
from logto_auth.models import LogtoAuthConfig

# Create a FastAPI application
app = FastAPI(title="Logto Auth Example")

# Configure Logto authentication
config = LogtoAuthConfig(
    endpoint="https://your-logto-endpoint",
    app_id="your-app-id",
    app_secret="your-app-secret",
    redirect_uri="http://localhost:8000/auth/callback",
    jwt_secret_key="your-jwt-secret-key",  # Required for JWT signing
    jwt_algorithm="HS256",  # Default: "HS256"
    access_token_expire_minutes=30,  # Default: 30
    cors_origins=["http://localhost:3000"],  # Default: []
    enable_rate_limiting=True,  # Default: True
    rate_limit_requests_per_minute=60,  # Default: 60
    # These would normally be derived automatically, but we'll set them explicitly
    token_endpoint="https://your-logto-endpoint/oidc/token",
    jwks_uri="https://your-logto-endpoint/oidc/jwks",
    issuer="https://your-logto-endpoint",
    audience="your-app-id",
)

# Set up authentication
app = setup_auth(app, config)


# Add your routes here
@app.get("/")
async def root():
    return {"message": "Welcome to the Logto Auth Example"}
