from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings...
    """

    PROJECT_NAME: str = "Particle0"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,https://particle0.vercel.app"

    # JWT Settings
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Logto Settings
    LOGTO_ENDPOINT: str = "https://logto.dev"
    LOGTO_APP_ID: str = ""
    LOGTO_APP_SECRET: str = ""
    LOGTO_REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
