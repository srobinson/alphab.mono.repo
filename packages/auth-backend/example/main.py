import os
from fastapi import FastAPI
from dotenv import load_dotenv

from logto_auth import setup_auth
from logto_auth.models import LogtoAuthConfig

# Load environment variables from .env file
load_dotenv()

# Create a FastAPI application
app = FastAPI(title="Logto Auth Example")

# Configure Logto authentication from environment variables
config = LogtoAuthConfig(
    endpoint=os.getenv("LOGTO_ENDPOINT"),
    app_id=os.getenv("LOGTO_APP_ID"),
    app_secret=os.getenv("LOGTO_APP_SECRET"),
    resource=os.getenv("LOGTO_API_RESOURCE"), # The API resource indicator (audience)
    redirect_uri=os.getenv("LOGTO_REDIRECT_URI", "http://localhost:8000/auth/callback"),
    jwt_secret_key=os.getenv("JWT_SECRET_KEY"),  # Required for JWT signing
    jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
    access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),
    cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
)

# Set up authentication
app = setup_auth(app, config)


# Add your routes here
@app.get("/")
async def root():
    """A simple public endpoint."""
    return {"message": "Welcome to the Logto Auth Example"}

@app.get("/protected")
async def protected_route():
    """A simple protected endpoint."""
    return {"message": "This is a protected resource. You are authenticated!"}
