from datetime import datetime

from pydantic import BaseModel


class WhoisLookupRequest(BaseModel):
    """Request model for WHOIS lookup."""

    domain: str


class WhoisResponse(BaseModel):
    """Response model for WHOIS data."""

    domain_name: str | list[str] | None = None
    registrar: str | None = None
    creation_date: datetime | list[datetime] | None = None
    expiration_date: datetime | list[datetime] | None = None
    updated_date: datetime | list[datetime] | None = None
    name_servers: list[str] | None = None
    status: str | list[str] | None = None
    emails: str | list[str] | None = None
    org: str | None = None
    country: str | None = None
    raw_text: str | None = None

