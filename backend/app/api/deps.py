from functools import lru_cache

from app.core.config import get_settings
from app.services.geoip import GeoIPService

_geoip_service: GeoIPService | None = None


def get_geoip_service() -> GeoIPService:
    """Get the GeoIP service singleton instance."""
    global _geoip_service
    if _geoip_service is None:
        settings = get_settings()
        _geoip_service = GeoIPService(settings.geoip_db_path)
        _geoip_service.open()
    return _geoip_service


def close_geoip_service() -> None:
    """Close the GeoIP service."""
    global _geoip_service
    if _geoip_service is not None:
        _geoip_service.close()
        _geoip_service = None

