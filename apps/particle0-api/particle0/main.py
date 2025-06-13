from alphab_logging import create_logger
from alphab_logto import LogtoAuthConfig
from alphab_logto import routes as auth_routes
from alphab_logto import setup_auth
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from particle0.api.v1.api import api_router
from particle0.core.config import settings

# Initialize logger for this module - simple and clean
logger = create_logger("particle0.main")


def create_application() -> FastAPI:
    """
    Create FastAPI application with configured settings.
    """
    logger.info(
        "🚀 Starting Particle0 application", project_name=settings.PROJECT_NAME, api_version=settings.API_V1_STR
    )

    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    logger.info("✅ FastAPI application created successfully", docs_url="/docs", redoc_url="/redoc")

    # Set up CORS
    logger.info("🌐 Configuring CORS settings", raw_origins=settings.BACKEND_CORS_ORIGINS)

    if settings.BACKEND_CORS_ORIGINS:
        # Split the comma-separated string into a list of origins
        origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
        logger.info(
            "✅ CORS origins configured",
            origins=origins,
            allow_credentials=True,
            allow_methods=["ALL"],
            allow_headers=["ALL"],
        )

        application.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        logger.warning("⚠️  No CORS origins configured - this may cause issues in production")

    # Set up authentication with Logto
    logger.info(
        "🔐 Configuring Logto authentication",
        endpoint=settings.LOGTO_ENDPOINT,
        app_id=settings.LOGTO_APP_ID[:8] + "..." if settings.LOGTO_APP_ID else "NOT_SET",
        redirect_uri=settings.LOGTO_REDIRECT_URI,
        rate_limiting=True,
        rate_limit_rpm=100,
    )

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
    logger.info("✅ Authentication configured successfully")

    # Add API routes (excluding auth routes which are now handled by logto_auth)
    logger.info("🛣️  Configuring API routes", api_prefix=settings.API_V1_STR, auth_prefix=settings.API_V1_STR + "/auth")

    application.include_router(api_router, prefix=settings.API_V1_STR)
    application.include_router(auth_routes.router, prefix=settings.API_V1_STR + "/auth")

    @application.get("/")
    async def root() -> dict[str, str]:
        logger.info("📍 Root endpoint accessed")
        return {"message": "Welcome to Particle0 API"}

    logger.info("🎉 Particle0 application setup completed successfully!")
    return application


# Create the FastAPI application
app = create_application()
