from pathlib import Path

import geoip2.database
from geoip2.errors import AddressNotFoundError

from app.models.geo import GeoIPResponse


class GeoIPService:
    def __init__(self, db_path: Path) -> None:
        """Initialize the GeoIP service.

        Args:
            db_path: Path to the GeoLite2 database file.
        """
        self.db_path = db_path
        self._reader: geoip2.database.Reader | None = None

    def open(self) -> None:
        """Open the database reader."""
        if self._reader is None:
            self._reader = geoip2.database.Reader(str(self.db_path))

    def close(self) -> None:
        """Close the database reader."""
        if self._reader is not None:
            self._reader.close()
            self._reader = None

    def lookup(self, ip_address: str) -> GeoIPResponse:
        """Look up geolocation data for an IP address.

        Args:
            ip_address: The IP address to look up.

        Returns:
            GeoIPResponse with country and location data.

        Raises:
            ValueError: If the database is not open.
            AddressNotFoundError: If the IP address is not in the database.
        """
        if self._reader is None:
            raise ValueError("Database reader is not open. Call open() first.")

        try:
            response = self._reader.country(ip_address)
            return GeoIPResponse(
                ip_address=ip_address,
                country_iso_code=response.country.iso_code,
                country_name=response.country.name,
                continent=response.continent.name,
                is_in_european_union=response.country.is_in_european_union or False,
            )
        except AddressNotFoundError:
            raise ValueError(f"IP address {ip_address} not found in the database.")
        except Exception as e:
            raise ValueError(f"Error looking up IP address {ip_address}")

    def __enter__(self) -> "GeoIPService":
        """Context manager entry."""
        self.open()
        return self

    def __exit__(self, *args) -> None:
        """Context manager exit."""
        self.close()

