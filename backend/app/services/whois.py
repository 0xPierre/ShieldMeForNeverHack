import whois

from app.models.whois import WhoisResponse


class WhoisService:
    """Service for performing WHOIS lookups on domains."""

    def lookup(self, domain: str) -> WhoisResponse:
        """Look up WHOIS data for a domain.

        Args:
            domain: The domain name to look up.

        Returns:
            WhoisResponse with domain registration data.

        Raises:
            ValueError: If the domain lookup fails.
        """
        try:
            w = whois.whois(domain)

            return WhoisResponse(
                domain_name=w.domain_name,
                registrar=w.registrar,
                creation_date=w.creation_date,
                expiration_date=w.expiration_date,
                updated_date=w.updated_date,
                name_servers=w.name_servers,
                status=w.status,
                emails=w.emails,
                org=w.org,
                country=w.country,
                raw_text=w.text,
            )
        except Exception as e:
            raise ValueError(f"Error looking up domain {domain}: {e}")


# Singleton instance
_whois_service: WhoisService | None = None


def get_whois_service() -> WhoisService:
    """Get the WHOIS service singleton instance."""
    global _whois_service
    if _whois_service is None:
        _whois_service = WhoisService()
    return _whois_service

