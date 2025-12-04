from pydantic import BaseModel, IPvAnyAddress


class GeoLookupRequest(BaseModel):
    """Request model for IP geolocation lookup."""

    ip_address: IPvAnyAddress


class GeoIPResponse(BaseModel):
    """Response model for IP geolocation data."""

    ip_address: str
    country_iso_code: str | None = None
    country_name: str | None = None
    continent: str | None = None
    is_in_european_union: bool = False

