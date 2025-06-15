from alphab_logging import create_logger
from fastapi import APIRouter

router = APIRouter()
logger = create_logger("particle0.api.v1.endpoints.health")


@router.get("/")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint.
    """
    logger.info("Health check endpoint")
    return {"status": "healthy"}
