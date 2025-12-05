from fastapi import APIRouter, HTTPException, Request

from app.api.deps import get_geoip_service
from app.models.geo import GeoDomainLookupRequest, GeoIPResponse, GeoLookupRequest

router = APIRouter()


@router.post("/lookup", response_model=GeoIPResponse)
async def lookup_ip(request: GeoLookupRequest) -> GeoIPResponse:
    """Look up geolocation data for a specific IP address."""
    service = get_geoip_service()
    return service.lookup(str(request.ip_address))


@router.post("/lookup-domain", response_model=GeoIPResponse)
async def lookup_domain(request: GeoDomainLookupRequest) -> GeoIPResponse:
    """Look up geolocation data for a domain name."""
    service = get_geoip_service()
    try:
        return service.lookup_domain(request.domain)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=GeoIPResponse)
async def get_my_location(request: Request) -> GeoIPResponse:
    """Get geolocation data for the requesting client's IP address."""
    client_ip = request.client.host if request.client else None

    if not client_ip:
        raise HTTPException(status_code=400, detail="Could not determine client IP")

    service = get_geoip_service()
    return service.lookup(client_ip)

