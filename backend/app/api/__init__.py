from fastapi import APIRouter

from app.api.routes import geo, health, phishing, whois

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(geo.router, prefix="/geo", tags=["geolocation"])
api_router.include_router(phishing.router, prefix="/phishing", tags=["phishing"])

api_router.include_router(whois.router, prefix="/whois", tags=["whois"])
