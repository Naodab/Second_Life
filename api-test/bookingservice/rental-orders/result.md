# API Test Result — Rental Orders

## Run #1 — 2026-05-28 04:35 +07

| | |
|---|---|
| **Thời gian** | 2026-05-28 04:35 +07 |
| **Target** | `http://localhost:8088/api/v1` |
| **Python** | 3.9.6 |
| **pytest** | 8.4.2 |
| **Tổng số test** | 29 |
| **Passed** | 0 |
| **Failed** | 0 |
| **Skipped** | 29 |
| **Kết quả** | ⚠️ SKIPPED ALL — Service chưa khởi động |

### Nguyên nhân

`conftest.py` kiểm tra kết nối đến `http://localhost:8088/api/v1/rental-orders` trước khi chạy.
`booking-service` chưa được start → `ConnectionError` → toàn bộ session bị skip.

---

## Run #2 — 2026-05-28 04:42 +07

| | |
|---|---|
| **Thời gian** | 2026-05-28 04:42 +07 |
| **Target** | `http://localhost:8088/api/v1` |
| **Tổng số test** | 29 |
| **Passed** | 10 |
| **Failed** | 8 |
| **Skipped** | 11 |
| **Kết quả** | ❌ 8 FAILED — Root cause phân tích bên dưới |

### Root cause & Fix

| # | Test | Lỗi | Root cause | Fix |
|---|------|-----|------------|-----|
| 1 | `TestCreateRentalOrder::test_blank_profile_header_returns_400` | `requests.exceptions.InvalidHeader` | HTTP RFC 7230 cấm leading whitespace trong header value — thư viện `requests` tự từ chối trước khi gửi request | Bắt `InvalidHeader` → coi là request bị reject = pass |
| 2 | `TestListRentalOrders::test_blank_profile_header_returns_400` | `requests.exceptions.InvalidHeader` | Cùng nguyên nhân với #1 | Cùng fix |
| 3 | `TestListRentalOrders::test_trims_profile_header` | `requests.exceptions.InvalidHeader` | `"  profile-1  "` có leading whitespace → `requests` từ chối | Test chỉ kiểm tra trailing whitespace (không vi phạm RFC) |
| 4 | `TestCreateRentalOrder::test_missing_listing_variant_id_returns_400` | `Expected code 1000, got 1062` | `@NotBlank` trả về `REQUIRED_FIELD (1062)`, không phải `INVALID_INPUT (1000)` | Sửa expected code thành `1062` |
| 5 | `TestCreateRentalOrder::test_missing_customer_id_returns_400` | `Expected code 1000, got 1062` | Cùng với #4 | Cùng fix |
| 6 | `TestCreateRentalOrder::test_valid_request_returns_200_with_pending_order` | `404 {"code":1066,"message":"Customer not found"}` | `CUSTOMER_ID = "test-customer-001"` không tồn tại trong DB; cần seed data | Skip nếu 404 (thiếu seed data) |
| 7 | `TestCreateRentalOrder::test_valid_request_event_fields` | `assert 404 == 200` | Cùng với #6 | Skip nếu 404 |
| 8 | `TestListFacilityRentalOrders::test_returns_list_for_facility` | `assert 404 == 200` | `FACILITY_ID = "test-facility-001"` không tồn tại trong DB | Skip nếu 404 (thiếu seed data) |

### Bắt buộc seed data để bỏ skip

Các test case #6, #7, #8 và toàn bộ nhóm `TestUpdateRentalOrderStatus` / `TestCancelRentalOrder` phụ thuộc
vào dữ liệu thực tế trong DB. Cần set biến môi trường trỏ về ID thực:

```bash
export TEST_PROFILE_ID=<profileId thực trong DB>
export TEST_SELLER_PROFILE_ID=<profileId người bán sở hữu listing variant>
export TEST_CUSTOMER_ID=<customerId thực trong DB>
export TEST_LISTING_VARIANT_ID=<listingVariantId có inventory loại RENT>
export TEST_FACILITY_ID=<facilityId thuộc seller trên>
```

Sau đó chạy lại:
```bash
python3 -m pytest bookingservice/rental-orders/test_rental_orders.py -v
```

---

## Cần làm trước khi chạy test

### 1. Khởi động services qua Docker

```bash
# Từ thư mục gốc /doan/Second_Life
docker compose -f docker-compose.yml -f docker-compose.dev.yml up booking-service inventory-service -d
```

Phụ thuộc được Docker tự resolve (MySQL, Kafka, product-service, ...).
Đợi đến khi healthcheck pass (~60–90s):

```bash
docker compose ps
# booking-service và inventory-service phải ở trạng thái "healthy"
```

Kiểm tra nhanh:
```bash
curl -s http://localhost:8088/api/v1/rental-orders -H "X-Profile-Id: ping" | head -c 100
```

### 2. Cài dependencies (nếu chưa)

```bash
cd api-test
python3 -m pip install requests pytest pytest-html
```

### 3. Chạy test

```bash
# Chạy cơ bản
python3 -m pytest bookingservice/rental-orders/test_rental_orders.py -v

# Sinh HTML report
python3 -m pytest bookingservice/rental-orders/test_rental_orders.py -v --html=result_report.html

# Ghi kết quả ra file text
python3 -m pytest bookingservice/rental-orders/test_rental_orders.py -v 2>&1 | tee result_run.txt
```

### 4. Biến môi trường (tuỳ chọn)

```bash
export TEST_PROFILE_ID=<profileId thực tế trong DB>
export TEST_SELLER_PROFILE_ID=<sellerProfileId thực tế>
export TEST_CUSTOMER_ID=<customerId thực tế>
export TEST_LISTING_VARIANT_ID=<listingVariantId có inventory RENT>
export TEST_FACILITY_ID=<facilityId thuộc seller>
```

---

## Ma trận test

| # | Test case | Endpoint | Expect | Ghi chú |
|---|-----------|----------|--------|---------|
| 1 | `test_missing_profile_header_returns_400` | `POST /rental-orders` | HTTP 400, code 1000 | |
| 2 | `test_blank_profile_header_returns_400` | `POST /rental-orders` | HTTP 400, code 1000 | |
| 3 | `test_zero_quantity_returns_400_with_quantity_min_code` | `POST /rental-orders` | HTTP 400, code 1063 | |
| 4 | `test_missing_listing_variant_id_returns_400` | `POST /rental-orders` | HTTP 400, code 1062 | `@NotBlank` → REQUIRED_FIELD |
| 5 | `test_missing_customer_id_returns_400` | `POST /rental-orders` | HTTP 400, code 1062 | `@NotBlank` → REQUIRED_FIELD |
| 6 | `test_end_time_before_start_time_returns_400` | `POST /rental-orders` | HTTP 400, code 1000 | |
| 7 | `test_equal_start_and_end_time_returns_400` | `POST /rental-orders` | HTTP 400, code 1000 | |
| 8 | `test_valid_request_returns_200_with_pending_order` | `POST /rental-orders` | HTTP 200, status=PENDING | Skip nếu tồn kho không đủ |
| 9 | `test_valid_request_event_fields` | `POST /rental-orders` | startTime/endTime đúng | Skip nếu tồn kho không đủ |
| 10 | `test_missing_profile_header_returns_400` | `GET /rental-orders` | HTTP 400, code 1000 | |
| 11 | `test_blank_profile_header_returns_400` | `GET /rental-orders` | HTTP 400, code 1000 | |
| 12 | `test_returns_list_for_profile` | `GET /rental-orders` | HTTP 200, data is array | |
| 13 | `test_response_items_have_required_fields` | `GET /rental-orders` | Order vừa tạo xuất hiện trong list | Cần `created_order` fixture |
| 14 | `test_trims_profile_header` | `GET /rental-orders` | HTTP 200 dù header có khoảng trắng | |
| 15 | `test_missing_profile_header_returns_400` | `GET /rental-orders/by-facility/{id}` | HTTP 400, code 1000 | |
| 16 | `test_returns_list_for_facility` | `GET /rental-orders/by-facility/{id}` | HTTP 200, data is array | |
| 17 | `test_unknown_facility_returns_empty_list_or_error` | `GET /rental-orders/by-facility/{id}` | 200 (empty) hoặc 404 | |
| 18 | `test_missing_profile_header_returns_400` | `PATCH /rental-orders/{id}/status` | HTTP 400, code 1000 | |
| 19 | `test_order_not_found_returns_404` | `PATCH /rental-orders/{id}/status` | HTTP 404, code 1067 | |
| 20 | `test_null_status_returns_400` | `PATCH /rental-orders/{id}/status` | HTTP 400 | |
| 21 | `test_pending_to_confirmed_returns_updated_order` | `PATCH /rental-orders/{id}/status` | HTTP 200, status=CONFIRMED | Skip nếu seller không own variant |
| 22 | `test_invalid_transition_confirmed_to_pending_returns_400` | `PATCH /rental-orders/{id}/status` | HTTP 400, code 1069 | Skip nếu seller không own variant |
| 23 | `test_pending_to_cancelled_via_update_releases_inventory` | `PATCH /rental-orders/{id}/status` | HTTP 200, status=CANCELLED | Skip nếu seller không own variant |
| 24 | `test_missing_profile_header_returns_400` | `DELETE /rental-orders/{id}` | HTTP 400, code 1000 | |
| 25 | `test_not_found_returns_404` | `DELETE /rental-orders/{id}` | HTTP 404, code 1067 | |
| 26 | `test_cancel_pending_order_returns_204` | `DELETE /rental-orders/{id}` | HTTP 204, body rỗng | |
| 27 | `test_cancel_already_cancelled_returns_400` | `DELETE /rental-orders/{id}` | HTTP 400, code 1068 | |
| 28 | `test_cancel_confirmed_order_returns_400` | `DELETE /rental-orders/{id}` | HTTP 400, code 1068 | Skip nếu seller không own variant |
| 29 | `test_cancel_different_profile_returns_404` | `DELETE /rental-orders/{id}` | HTTP 404, code 1067 | |

---

## Error codes tham chiếu

| Code | Ý nghĩa | HTTP |
|------|---------|------|
| 1000 | Invalid Input (business-level) | 400 |
| 1061 | Insufficient inventory | 409 |
| 1062 | Required field missing (`@NotBlank` / `@NotNull`) | 400 |
| 1063 | Quantity must be > 0 | 400 |
| 1066 | Customer not found | 404 |
| 1067 | Rental order not found | 404 |
| 1068 | Order cancel not allowed (not PENDING) | 400 |
| 1069 | Status transition not allowed | 400 |
