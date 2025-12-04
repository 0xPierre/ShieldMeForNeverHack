from fastapi import APIRouter, HTTPException

from app.models.whois import WhoisLookupRequest, WhoisResponse
from app.services.whois import get_whois_service

router = APIRouter()


@router.post("/lookup", response_model=WhoisResponse)
async def lookup_domain(request: WhoisLookupRequest) -> WhoisResponse:
    """Look up WHOIS data for a domain."""
    try:
        service = get_whois_service()
        return service.lookup(request.domain)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

