import os
from pathlib import Path

SUB_PHONE = "sub-phone"

CURRENT_YEAR = int(os.getenv("CURRENT_YEAR", "2025"))
PRICE_MIN = 500_000
PRICE_MAX = 80_000_000

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = Path(os.getenv("AISERVICE_MODEL_DIR", BASE_DIR / "models" / "v10"))

HOST = os.getenv("AISERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AISERVICE_PORT", "8090"))
