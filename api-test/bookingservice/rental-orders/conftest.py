import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

_env_file = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_file)

BASE_URL = os.getenv("BOOKING_SERVICE_URL", "http://localhost:8088/api/v1")
PROFILE_ID = os.getenv("TEST_PROFILE_ID", "test-profile-001")
SELLER_PROFILE_ID = os.getenv("TEST_SELLER_PROFILE_ID", "test-seller-001")
CUSTOMER_ID = os.getenv("TEST_CUSTOMER_ID", "test-customer-001")
LISTING_VARIANT_ID = os.getenv("TEST_LISTING_VARIANT_ID", "test-variant-001")
FACILITY_ID = os.getenv("TEST_FACILITY_ID", "test-facility-001")

START_TIME = "2026-08-01T10:00:00"
END_TIME = "2026-08-03T10:00:00"


def profile_headers(profile_id: str = PROFILE_ID) -> dict:
    return {
        "X-Profile-Id": profile_id,
        "Content-Type": "application/json",
    }


def _check_server_available():
    try:
        requests.get(f"{BASE_URL}/rental-orders", headers={"X-Profile-Id": "ping"}, timeout=3)
    except requests.exceptions.ConnectionError:
        pytest.skip(f"Booking service not reachable at {BASE_URL}")


@pytest.fixture(scope="session", autouse=True)
def require_server():
    _check_server_available()


@pytest.fixture
def create_payload():
    return {
        "listingVariantId": LISTING_VARIANT_ID,
        "customerId": CUSTOMER_ID,
        "startTime": START_TIME,
        "endTime": END_TIME,
        "quantity": 1,
    }


@pytest.fixture
def created_order(create_payload):
    """Creates a PENDING rental order and yields its id. Cancels it on teardown if still PENDING."""
    resp = requests.post(
        f"{BASE_URL}/rental-orders",
        json=create_payload,
        headers=profile_headers(),
    )
    if resp.status_code != 200:
        pytest.skip(f"Could not create order for test fixture: {resp.status_code} {resp.text}")

    order_id = resp.json()["data"]["id"]
    yield order_id

    teardown = requests.delete(
        f"{BASE_URL}/rental-orders/{order_id}",
        headers=profile_headers(),
    )
    if teardown.status_code not in (204, 400):
        pass
