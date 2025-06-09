from app.api.v1.endpoints import auth, example, health
from fastapi import APIRouter

print("api.py ================>")

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(example.router, prefix="/examples", tags=["examples"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
