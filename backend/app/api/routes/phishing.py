from fastapi import APIRouter
from pathlib import Path

from app.models.phishing import DomainRequest

router = APIRouter()

# Load phishing domains once at startup
PHISHING_FILE = Path("data/phishing-domains-ACTIVE.txt")
try:
    with PHISHING_FILE.open("r") as f:
        print("hello")
        PHISHING_DOMAINS = set(f.read().splitlines())
except FileNotFoundError:
    print("File not found!")
    PHISHING_DOMAINS = set()
except Exception as e:
    print("Error reading phishing file:", e)
    PHISHING_DOMAINS = set()



@router.post("/check-domain-phishing")
async def check_phishing(body: DomainRequest) -> dict:
    domain = body.domain
    is_phishing = domain in PHISHING_DOMAINS
    return {"phishing": is_phishing}
