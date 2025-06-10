from fastapi import APIRouter
from particle0_backend.api.v1.endpoints import example, health

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(example.router, prefix="/examples", tags=["examples"])

# Note: Auth router is now handled by logto_auth package
