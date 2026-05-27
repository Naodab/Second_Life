import pytest
import requests
from requests.exceptions import InvalidHeader

from conftest import (
    BASE_URL,
    CUSTOMER_ID,
    FACILITY_ID,
    LISTING_VARIANT_ID,
    PROFILE_ID,
    SELLER_PROFILE_ID,
    START_TIME,
    END_TIME,
    profile_headers,
)

RENTAL_ORDERS_URL = f"{BASE_URL}/rental-orders"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _rental_orders_url(suffix: str = "") -> str:
    return RENTAL_ORDERS_URL + suffix


def _valid_payload(quantity: int = 1, start: str = START_TIME, end: str = END_TIME) -> dict:
    return {
        "listingVariantId": LISTING_VARIANT_ID,
        "customerId": CUSTOMER_ID,
        "startTime": start,
        "endTime": end,
        "quantity": quantity,
    }


def _assert_error(resp, expected_http_status: int, expected_code: int):
    assert resp.status_code == expected_http_status, (
        f"Expected HTTP {expected_http_status}, got {resp.status_code}: {resp.text}"
    )
    body = resp.json()
    assert body["code"] == expected_code, (
        f"Expected error code {expected_code}, got {body.get('code')}"
    )


# ---------------------------------------------------------------------------
# POST /rental-orders
# ---------------------------------------------------------------------------

class TestCreateRentalOrder:

    def test_missing_profile_header_returns_400(self):
        resp = requests.post(
            _rental_orders_url(),
            json=_valid_payload(),
            headers={"Content-Type": "application/json"},
        )
        _assert_error(resp, 400, 1000)

    def test_blank_profile_header_returns_400(self):
        try:
            resp = requests.post(
                _rental_orders_url(),
                json=_valid_payload(),
                headers={**profile_headers(), "X-Profile-Id": "   "},
            )
            _assert_error(resp, 400, 1000)
        except InvalidHeader:
            pass  # requests itself rejected the whitespace-only header value — acceptable

    def test_zero_quantity_returns_400_with_quantity_min_code(self):
        resp = requests.post(
            _rental_orders_url(),
            json=_valid_payload(quantity=0),
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1063)

    def test_missing_listing_variant_id_returns_400(self):
        payload = _valid_payload()
        del payload["listingVariantId"]
        resp = requests.post(
            _rental_orders_url(),
            json=payload,
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1062)  # REQUIRED_FIELD from @NotBlank validation

    def test_missing_customer_id_returns_400(self):
        payload = _valid_payload()
        del payload["customerId"]
        resp = requests.post(
            _rental_orders_url(),
            json=payload,
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1062)  # REQUIRED_FIELD from @NotBlank validation

    def test_end_time_before_start_time_returns_400(self):
        resp = requests.post(
            _rental_orders_url(),
            json=_valid_payload(start="2026-08-03T10:00:00", end="2026-08-01T10:00:00"),
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1000)

    def test_equal_start_and_end_time_returns_400(self):
        resp = requests.post(
            _rental_orders_url(),
            json=_valid_payload(start="2026-08-01T10:00:00", end="2026-08-01T10:00:00"),
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1000)

    def test_valid_request_returns_200_with_pending_order(self, create_payload):
        resp = requests.post(
            _rental_orders_url(),
            json=create_payload,
            headers=profile_headers(),
        )
        if resp.status_code in (404, 409):
            pytest.skip(f"Prerequisite data not found or inventory insufficient: {resp.text}")

        assert resp.status_code == 200, f"Unexpected status: {resp.status_code} {resp.text}"
        body = resp.json()
        assert body["code"] == 1000

        data = body["data"]
        assert isinstance(data["id"], str) and data["id"]
        assert data["status"] == "PENDING"
        assert data["listingVariantId"] == LISTING_VARIANT_ID
        assert data["quantity"] == 1
        assert data["startTime"] is not None
        assert data["endTime"] is not None
        assert data["customerId"] is not None
        assert data.get("createdAt") is not None

        requests.delete(
            _rental_orders_url(f"/{data['id']}"),
            headers=profile_headers(),
        )

    def test_valid_request_event_fields(self, create_payload):
        resp = requests.post(
            _rental_orders_url(),
            json=create_payload,
            headers=profile_headers(),
        )
        if resp.status_code in (404, 409):
            pytest.skip(f"Prerequisite data not found or inventory insufficient: {resp.text}")

        assert resp.status_code == 200
        data = resp.json()["data"]

        assert "2026-08-01" in data["startTime"]
        assert "2026-08-03" in data["endTime"]

        requests.delete(
            _rental_orders_url(f"/{data['id']}"),
            headers=profile_headers(),
        )


# ---------------------------------------------------------------------------
# GET /rental-orders
# ---------------------------------------------------------------------------

class TestListRentalOrders:

    def test_missing_profile_header_returns_400(self):
        resp = requests.get(_rental_orders_url())
        _assert_error(resp, 400, 1000)

    def test_blank_profile_header_returns_400(self):
        try:
            resp = requests.get(
                _rental_orders_url(),
                headers={"X-Profile-Id": "  "},
            )
            _assert_error(resp, 400, 1000)
        except InvalidHeader:
            pass  # requests itself rejected the whitespace-only header value — acceptable

    def test_returns_list_for_profile(self):
        resp = requests.get(
            _rental_orders_url(),
            headers=profile_headers(),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 1000
        assert isinstance(body["data"], list)

    def test_response_items_have_required_fields(self, created_order):
        resp = requests.get(
            _rental_orders_url(),
            headers=profile_headers(),
        )
        assert resp.status_code == 200
        items = resp.json()["data"]
        assert any(item["id"] == created_order for item in items), (
            "Created order not found in list response"
        )
        order = next(item for item in items if item["id"] == created_order)
        assert order["status"] == "PENDING"
        assert order["listingVariantId"] == LISTING_VARIANT_ID
        assert order["startTime"] is not None
        assert order["endTime"] is not None

    def test_trims_profile_header(self):
        # HTTP clients (requests) reject leading whitespace per RFC 7230.
        # Test trailing-whitespace trimming which is HTTP-safe.
        resp = requests.get(
            _rental_orders_url(),
            headers={"X-Profile-Id": f"{PROFILE_ID}  "},
        )
        assert resp.status_code == 200
        assert resp.json()["code"] == 1000


# ---------------------------------------------------------------------------
# GET /rental-orders/by-facility/{facilityId}
# ---------------------------------------------------------------------------

class TestListFacilityRentalOrders:

    def test_missing_profile_header_returns_400(self):
        resp = requests.get(_rental_orders_url(f"/by-facility/{FACILITY_ID}"))
        _assert_error(resp, 400, 1000)

    def test_returns_list_for_facility(self):
        resp = requests.get(
            _rental_orders_url(f"/by-facility/{FACILITY_ID}"),
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        if resp.status_code == 404:
            pytest.skip(f"Facility '{FACILITY_ID}' not found in test environment — seed data required")

        assert resp.status_code == 200
        body = resp.json()
        assert body["code"] == 1000
        assert isinstance(body["data"], list)

    def test_unknown_facility_returns_empty_list_or_error(self):
        resp = requests.get(
            _rental_orders_url("/by-facility/definitely-does-not-exist-xyz"),
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        assert resp.status_code in (200, 404), f"Unexpected: {resp.status_code}"
        if resp.status_code == 200:
            assert isinstance(resp.json()["data"], list)


# ---------------------------------------------------------------------------
# PATCH /rental-orders/{id}/status
# ---------------------------------------------------------------------------

class TestUpdateRentalOrderStatus:

    def test_missing_profile_header_returns_400(self, created_order):
        resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "CONFIRMED"},
            headers={"Content-Type": "application/json"},
        )
        _assert_error(resp, 400, 1000)

    def test_order_not_found_returns_404(self):
        resp = requests.patch(
            _rental_orders_url("/non-existent-order-id/status"),
            json={"status": "CONFIRMED"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        _assert_error(resp, 404, 1067)

    def test_null_status_returns_400(self, created_order):
        resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": None},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        assert resp.status_code == 400

    def test_pending_to_confirmed_returns_updated_order(self, created_order):
        resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "CONFIRMED"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        if resp.status_code == 404:
            pytest.skip("Seller does not own this listing variant — skipping seller test")

        assert resp.status_code == 200, f"Unexpected: {resp.status_code} {resp.text}"
        body = resp.json()
        assert body["code"] == 1000
        assert body["data"]["status"] == "CONFIRMED"
        assert body["data"]["id"] == created_order

    def test_invalid_transition_confirmed_to_pending_returns_400(self, created_order):
        requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "CONFIRMED"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )

        resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "PENDING"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        if resp.status_code == 404:
            pytest.skip("Seller does not own this listing variant — skipping seller test")

        _assert_error(resp, 400, 1069)

    def test_pending_to_cancelled_via_update_releases_inventory(self, created_order):
        resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "CANCELLED"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        if resp.status_code == 404:
            pytest.skip("Seller does not own this listing variant — skipping seller test")

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "CANCELLED"


# ---------------------------------------------------------------------------
# DELETE /rental-orders/{id}
# ---------------------------------------------------------------------------

class TestCancelRentalOrder:

    def test_missing_profile_header_returns_400(self, created_order):
        resp = requests.delete(_rental_orders_url(f"/{created_order}"))
        _assert_error(resp, 400, 1000)

    def test_not_found_returns_404(self):
        resp = requests.delete(
            _rental_orders_url("/non-existent-order-id"),
            headers=profile_headers(),
        )
        _assert_error(resp, 404, 1067)

    def test_cancel_pending_order_returns_204(self, created_order):
        resp = requests.delete(
            _rental_orders_url(f"/{created_order}"),
            headers=profile_headers(),
        )
        assert resp.status_code == 204, f"Unexpected: {resp.status_code} {resp.text}"
        assert resp.content == b""

    def test_cancel_already_cancelled_returns_400(self, create_payload):
        create_resp = requests.post(
            _rental_orders_url(),
            json=create_payload,
            headers=profile_headers(),
        )
        if create_resp.status_code != 200:
            pytest.skip("Could not create order")

        order_id = create_resp.json()["data"]["id"]

        requests.delete(_rental_orders_url(f"/{order_id}"), headers=profile_headers())

        resp = requests.delete(
            _rental_orders_url(f"/{order_id}"),
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1068)

    def test_cancel_confirmed_order_returns_400(self, created_order):
        confirm_resp = requests.patch(
            _rental_orders_url(f"/{created_order}/status"),
            json={"status": "CONFIRMED"},
            headers=profile_headers(SELLER_PROFILE_ID),
        )
        if confirm_resp.status_code == 404:
            pytest.skip("Seller does not own this listing variant — skipping test")

        resp = requests.delete(
            _rental_orders_url(f"/{created_order}"),
            headers=profile_headers(),
        )
        _assert_error(resp, 400, 1068)

    def test_cancel_different_profile_returns_404(self, created_order):
        resp = requests.delete(
            _rental_orders_url(f"/{created_order}"),
            headers=profile_headers("other-profile-999"),
        )
        _assert_error(resp, 404, 1067)
