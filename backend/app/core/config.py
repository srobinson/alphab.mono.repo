from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings.
    """

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Particle0"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://particle0.vercel.app"]

    # Add more settings as needed for database, auth, etc.

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
