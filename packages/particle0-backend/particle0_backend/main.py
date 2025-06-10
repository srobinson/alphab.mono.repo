from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logto_auth import LogtoAuthConfig
from logto_auth import routes as auth_routes
from logto_auth import setup_auth
from particle0_backend.api.v1.api import api_router
from particle0_backend.core.config import settings


def create_application() -> FastAPI:
    """
    Create FastAPI application with configured settings.
    """
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Set up CORS
    if settings.BACKEND_CORS_ORIGINS:
        # Split the comma-separated string into a list of origins
        origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]
        application.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Set up authentication with Logto
    auth_config = LogtoAuthConfig(
        rate_limit_requests_per_minute=100,
        enable_rate_limiting=True,
        endpoint=settings.LOGTO_ENDPOINT,
        app_id=settings.LOGTO_APP_ID,
        app_secret=settings.LOGTO_APP_SECRET,
        redirect_uri=settings.LOGTO_REDIRECT_URI,
        jwt_secret_key=settings.JWT_SECRET_KEY,
        jwt_algorithm=settings.JWT_ALGORITHM,
        cors_origins=origins,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )  # type: ignore

    setup_auth(application, auth_config)

    # Add API routes (excluding auth routes which are now handled by logto_auth)
    application.include_router(api_router, prefix=settings.API_V1_STR)
    application.include_router(auth_routes.router, prefix=settings.API_V1_STR + "/auth")

    @application.get("/")
    async def root():
        return {"message": "Welcome to Particle0 API"}

    return application


app = create_application()
