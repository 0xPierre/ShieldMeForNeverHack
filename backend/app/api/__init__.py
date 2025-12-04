from fastapi import APIRouter

from app.api.routes import geo, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(geo.router, prefix="/geo", tags=["geolocation"])

