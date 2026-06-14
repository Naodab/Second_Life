#!/usr/bin/env python3
"""
Seed all data into the Second Life system (API-only, không cần MySQL).

Pipeline:
 1. Read raw_products.json
 2. Register seller accounts via API
 3. Login hoặc verify-email qua API (cần JWT_SECRET trong .env cho account mới)
 4. Tạo/load facilities từ FACILITY_DEFINITIONS (linkGoogleMap → /wards/resolve-coordinates)
 5. Create products + upload images
 6. Publish products
 7. Create listings (BUY / RENT)

Run: python3 seed_system.py
Requires: docker compose running, JWT_SECRET trong .env (account mới chưa verify)
       Điền linkGoogleMap trong FACILITY_DEFINITIONS (seller1: 3, seller2: 2, seller3: 2)
"""
from __future__ import annotations

import json
import time
import random
import logging
import sys
from pathlib import Path

import requests

from attribute_maps import ALL_ATTRIBUTE_IDS, build_variant
from category_registry import is_valid_sub_category, normalize_product_categories
from seed_api import (
  KAFKA_WAIT_SECS,
  authenticate_seller,
  ensure_facilities_from_definitions,
  jwt_secret,
)

GATEWAY = "http://localhost:80/api/v1"
RAW_DATA_FILE = Path(__file__).parent / "data" / "raw_products.json"

NUM_SELLERS = 3
SELLER_PASSWORD = "Seller@123456"

# seller1 → 3 cơ sở, seller2 → 2, seller3 → 2 (theo thứ tự mảng bên dưới)
FACILITIES_PER_SELLER = (3, 2, 2)

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
  handlers=[
    logging.StreamHandler(),
    logging.FileHandler("seed_system.log", encoding="utf-8"),
  ],
)
log = logging.getLogger(__name__)

# Wait time for Kafka to create profiles (seconds) — re-exported from seed_api

SELLERS = [
  {"email": f"seller{i+1}@secondlife.dev", "password": SELLER_PASSWORD}
  for i in range(NUM_SELLERS)
]

# Điền linkGoogleMap (URL place Google Maps) — script gọi /wards/resolve-coordinates
# để lấy provinceCode + wardCode trước khi POST /facilities.
FACILITY_DEFINITIONS = [
  {
    "name": "Cửa hàng Đồ cũ Thanh Xuân",
    "description": "Chuyên thu mua và bán đồ cũ chất lượng cao tại Hà Nội",
    "linkGoogleMap": "https://www.google.com/maps/place/92+Ng.+151B+Th%C3%A1i+H%C3%A0,+%C4%90%E1%BB%91ng+%C4%90a,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@21.0144395,105.8131202,1642m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135ab631786c623:0x4debe139700c0501!8m2!3d21.0144345!4d105.8156951!16s%2Fg%2F11hzb2wh3v!5m1!1e2?entry=ttu",
  },
  {
    "name": "Second Life Store - Cầu Giấy",
    "description": "Điểm mua bán và cho thuê đồ cũ uy tín tại Cầu Giấy",
    "linkGoogleMap": "https://www.google.com/maps/place/92+Ng.+151B+Th%C3%A1i+H%C3%A0,+%C4%90%E1%BB%91ng+%C4%90a,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@21.0144395,105.8131202,1642m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135ab631786c623:0x4debe139700c0501!8m2!3d21.0144345!4d105.8156951!16s%2Fg%2F11hzb2wh3v!5m1!1e2?entry=ttu",
  },
  {
    "name": "Chợ Đồ Cũ Bắc Từ Liêm",
    "description": "Nơi trao đổi đồ cũ lớn nhất quận Bắc Từ Liêm",
    "linkGoogleMap": "https://www.google.com/maps/place/92+Ng.+151B+Th%C3%A1i+H%C3%A0,+%C4%90%E1%BB%91ng+%C4%90a,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@21.0144395,105.8131202,1642m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135ab631786c623:0x4debe139700c0501!8m2!3d21.0144345!4d105.8156951!16s%2Fg%2F11hzb2wh3v!5m1!1e2?entry=ttu",
  },
  {
    "name": "Shop Đồ Cũ Quận 1 - HCM",
    "description": "Thu mua bán đồ cũ chính hãng tại Quận 1 TP.HCM",
    "linkGoogleMap": "https://www.google.com/maps/place/Nh%C3%A0+tr%E1%BB%8D+B%C3%ACnh+An/@10.9291237,106.7429663,423m/data=!3m1!1e3!4m6!3m5!1s0x3174d9b80d19505f:0x79f0814cb19d9f52!8m2!3d10.9307031!4d106.7451173!16s%2Fg%2F11f3q_p_ts!5m1!1e2?entry=ttu",
  },
  {
    "name": "Đồ Cũ Quận 3 - Thành phố HCM",
    "description": "Chuyên bán điện tử, thời trang, nội thất đã qua sử dụng",
    "linkGoogleMap": "https://www.google.com/maps/place/Ch%E1%BB%A3+T%C3%A2n+B%C3%ACnh/@10.9998247,106.8026074,990m/data=!3m1!1e3!4m6!3m5!1s0x3174db78c25ca9b5:0x42d2e684e31a0d61!8m2!3d10.9997502!4d106.8094185!16s%2Fg%2F11fl499h3q!5m1!1e2?entry=ttu",
  },
  {
    "name": "Vintage & Second Hand - Đà Nẵng",
    "description": "Kinh doanh đồ cũ vintage phong cách tại Đà Nẵng",
    "linkGoogleMap": "https://www.google.com/maps/place/B%E1%BA%A2O+Hl%E1%BB%82M+X%C3%83+H%E1%BB%98I+Qu%E1%BA%ADn+S%C6%A1n+Tr%C3%A0/@16.059968,108.2324573,148m/data=!3m1!1e3!4m6!3m5!1s0x314217851d53af1d:0x7bb2bf59b05202bb!8m2!3d16.0600146!4d108.2328915!16s%2Fg%2F11txp9cc34!5m1!1e2?entry=ttu",
  },
  {
    "name": "Kho Đồ Cũ Hải Châu",
    "description": "Kho hàng đồ cũ lớn với nhiều mặt hàng đa dạng",
    "linkGoogleMap": "https://www.google.com/maps/place/56+L%C3%A2m+Ho%C3%A0nh,+An+H%E1%BA%A3i,+%C4%90%C3%A0+N%E1%BA%B5ng+550000,+Vi%E1%BB%87t+Nam/@16.0605409,108.2452633,53m/data=!3m1!1e3!4m6!3m5!1s0x31421778eb29ca91:0x2379d6595afc2430!8m2!3d16.0604335!4d108.2453395!16s%2Fg%2F11kmctq6x6!5m1!1e2?entry=ttu",
  },
]

# ──────────────────────────────────────────────────────────────────────────────
# Utilities
# ──────────────────────────────────────────────────────────────────────────────
class APIClient:
  def __init__(self, base_url: str):
    self.base = base_url
    self.session = requests.Session()
    self.session.headers.update({"Content-Type": "application/json"})

  def _url(self, path: str) -> str:
    return f"{self.base}/{path.lstrip('/')}"

  def get(self, path: str, params: dict = None, **kwargs) -> dict:
    r = self.session.get(self._url(path), params=params, timeout=15, **kwargs)
    r.raise_for_status()
    return r.json()

  def post(self, path: str, json_body: dict = None, **kwargs) -> dict:
    r = self.session.post(self._url(path), json=json_body, timeout=15, **kwargs)
    r.raise_for_status()
    return r.json()

  def put(self, path: str, json_body: dict = None, **kwargs) -> dict:
    r = self.session.put(self._url(path), json=json_body, timeout=15, **kwargs)
    r.raise_for_status()
    return r.json()

  def with_auth(self, token: str) -> "APIClient":
    c = APIClient(self.base)
    c.session.headers.update({"Authorization": f"Bearer {token}"})
    return c


# ──────────────────────────────────────────────────────────────────────────────
# Phase 1 – Create accounts
# ──────────────────────────────────────────────────────────────────────────────
def register_sellers(api: APIClient) -> list[dict]:
  """
  Register sellers.
  Always add to the list even if email already exists —
  login phase will verify whether the account is valid.
  """
  registered = []
  for seller in SELLERS:
    try:
      api.post("/auth/register", seller)
      log.info("  ✓ Registered: %s", seller["email"])
    except requests.HTTPError as e:
      code = 0
      try:
        code = (e.response.json() or {}).get("code", 0)
      except Exception:
        pass
      if code == 1011 or (e.response and e.response.status_code == 409):
        log.info("  ~ Already exists: %s", seller["email"])
      else:
        log.warning("  ! Register returned %s for %s (will retry login)",
              e.response.status_code if e.response else "?",
              seller["email"])
    except Exception as e:
      log.warning("  ! Register exception for %s: %s (will retry login)", seller["email"], e)
    # Always append — login phase will filter
    registered.append(seller)
    time.sleep(0.3)
  return registered


# ──────────────────────────────────────────────────────────────────────────────
# Phase 2–3 – Login / verify-email (API)
# ──────────────────────────────────────────────────────────────────────────────
def login_sellers(api: APIClient, sellers: list[dict]) -> list[dict]:
  secret = jwt_secret()
  if not secret:
    log.warning("JWT_SECRET chưa set — chỉ login được seller đã verify sẵn")

  authenticated: list[dict] = []
  for seller in sellers:
    auth = authenticate_seller(api, seller, secret)
    if auth:
      authenticated.append(auth)
  return authenticated


# ──────────────────────────────────────────────────────────────────────────────
# Phase 4 – Facilities (resolve tọa độ + tạo nếu thiếu)
# ──────────────────────────────────────────────────────────────────────────────
def ensure_facilities(api: APIClient, sellers: list[dict]) -> list[dict]:
  expected_total = sum(FACILITIES_PER_SELLER[: len(sellers)])
  if len(FACILITY_DEFINITIONS) < expected_total:
    log.warning(
      "FACILITY_DEFINITIONS có %d mục, cần %d — thiếu sẽ không tạo đủ",
      len(FACILITY_DEFINITIONS),
      expected_total,
    )
  return ensure_facilities_from_definitions(
    api,
    sellers,
    FACILITY_DEFINITIONS,
    FACILITIES_PER_SELLER,
  )


def build_listing_variant(product_variant_id: str, listing_type: str, price: float) -> dict:
  """Build one ListingVariantCreateRequest."""
  variant: dict = {
    "productVariantId": product_variant_id,
    "quantity": random.randint(1, 5),
    "isActive": True,
  }
  if listing_type == "BUY":
    variant["buyPrice"] = max(price, 10000)
  elif listing_type == "RENT":
    variant["rentPrice"] = max(price, 5000)
    variant["rentUnit"] = random.choice(["DAY", "HOUR", "MONTH"])
  else:
    variant["buyPrice"] = max(price, 10000)
  return variant


def import_products(api: APIClient, raw_products: list[dict], facilities: list[dict]) -> int:
  """
  Import all products.
  Returns the number of successful imports.
  """
  if not facilities:
    log.error("No facilities available! Stopping import.")
    return 0

  success_count = 0
  skipped_category = 0
  fac_pool = facilities.copy()

  for i, raw in enumerate(raw_products):
    sub_id = raw.get("primarySubCategoryId", "")
    if not is_valid_sub_category(sub_id):
      skipped_category += 1
      log.warning("  [%d] Skip invalid sub-category %r: %s", i, sub_id, raw.get("name", "")[:60])
      continue
    normalize_product_categories(raw)

    fac = fac_pool[i % len(fac_pool)]
    auth_api = api.with_auth(fac["seller_token"])
    extra_headers = {"X-Profile-Id": fac["profile_id"]}

    listing_type = raw.get("listing_type", "BUY")
    price = float(raw.get("price") or 0)
    thumbnail = raw.get("thumbnail", "")
    images = raw.get("images", [])

    # Ensure name is long enough
    name = raw.get("name", "").strip()
    if len(name) < 3:
      name = f"Sản phẩm {i+1}"

    # ── Step 1: Create product ──────────────────────────────────────────────
    product_payload = {
      "name":                  name[:255],
      "description":           (raw.get("description") or name)[:8000],
      "primarySubCategoryId":  raw.get("primarySubCategoryId", "sub-phone"),
      "subCategoryIds":        raw.get("subCategoryIds", ["sub-phone"]),
      "attributeIds":          ALL_ATTRIBUTE_IDS,
      "variants":              [build_variant(raw, listing_type)],
    }
    if raw.get("manufactureYear"):
      product_payload["manufactureYear"] = int(raw["manufactureYear"])

    try:
      resp = auth_api.post("/products", product_payload, headers=extra_headers)
      product = resp.get("data") or resp
      product_id = product.get("id")
      if not product_id:
        log.warning("  [%d] Could not get product_id, skipping", i)
        continue
    except requests.HTTPError as e:
      body = e.response.text if e.response else str(e)
      log.error("  [%d] Create product failed: %s", i, body[:200])
      continue

    # ── Step 2: Upload images ───────────────────────────────────────────────
    if thumbnail or images:
      image_payload: dict = {
        "thumbnailUrl":    thumbnail or (images[0] if images else ""),
        "productImageUrls": images[:9],
        "videoUrl":         "",
      }
      try:
        auth_api.post(
          f"/products/{product_id}/images",
          image_payload,
          headers=extra_headers,
        )
      except requests.HTTPError as e:
        log.warning("  [%d] Upload images failed: %s", i, e.response.text if e.response else e)

    # ── Step 3: Publish product ──────────────────────────────────────────
    try:
      resp = auth_api.post(
        f"/products/{product_id}/publish",
        headers=extra_headers,
      )
      product_data = (resp.get("data") or resp)
    except requests.HTTPError as e:
      log.warning("  [%d] Publish failed: %s", i, e.response.text if e.response else e)
      continue

    # Wait for DB transaction and Kafka propagation
    time.sleep(0.5)

    # Fetch variants via API (more reliable than cached response)
    try:
      vresp = auth_api.get(
        f"/products/{product_id}/variants",
        headers=extra_headers,
      )
      variants = vresp.get("data") or []
    except Exception:
      variants = product_data.get("variants") or []

    if not variants:
      log.warning("  [%d] No variants after publish, skipping listing", i)
      continue

    # ── Step 4: Create listing ──────────────────────────────────────────────
    listing_variants = [
      build_listing_variant(v["id"], listing_type, price)
      for v in variants
      if v.get("id")
    ]
    listing_payload = {
      "productId":   product_id,
      "facilityId":  fac["facility_id"],
      "title":       name[:255],
      "description": (raw.get("description") or name)[:8000],
      "listingType": listing_type,
      "variants":    listing_variants,
    }

    try:
      auth_api.post("/listings", listing_payload, headers=extra_headers)
      success_count += 1
      if (i + 1) % 50 == 0:
        log.info("  Progress: %d/%d products imported", i + 1, len(raw_products))
    except requests.HTTPError as e:
      err_body = ""
      if e.response is not None:
        try:
          err_body = e.response.json()
        except Exception:
          err_body = e.response.text
      log.error(
        "  [%d] Create listing failed HTTP %s | %s\n"
        "       payload=%s",
        i,
        e.response.status_code if e.response else "?",
        err_body,
        json.dumps(listing_payload, ensure_ascii=False)[:400],
      )

    time.sleep(random.uniform(0.2, 0.5))

  if skipped_category:
    log.info("Skipped %d products (invalid sub-category)", skipped_category)
  return success_count


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
  if not RAW_DATA_FILE.exists():
    log.error("File not found: %s – run crawl_tiki.py first!", RAW_DATA_FILE)
    sys.exit(1)

  log.info("Reading data from %s ...", RAW_DATA_FILE)
  with open(RAW_DATA_FILE, encoding="utf-8") as f:
    raw_products = json.load(f)
  log.info("Product count: %d", len(raw_products))

  api = APIClient(GATEWAY)

  # ── Phase 1: Register ────────────────────────────────────────────────────
  log.info("\n📋 Phase 1: Register sellers...")
  registered = register_sellers(api)
  log.info("Registered sellers: %d", len(registered))

  # ── Phase 2–3: Login / verify-email ─────────────────────────────────────
  log.info("\n🔑 Phase 2–3: Login sellers (API)...")
  log.info("Waiting %ds for Kafka profiles after register...", KAFKA_WAIT_SECS)
  time.sleep(KAFKA_WAIT_SECS)
  authenticated = login_sellers(api, registered)
  if not authenticated:
    log.error("No sellers logged in! Stopping.")
    sys.exit(1)
  log.info("Logged-in sellers: %d", len(authenticated))

  # ── Phase 4: Facilities (resolve-coordinates + tạo nếu thiếu) ───────────
  log.info("\n🏪 Phase 4: Ensure facilities (resolve-coordinates + API)...")
  facilities = ensure_facilities(api, authenticated)
  if not facilities:
    log.error("No facilities! Kiểm tra FACILITY_DEFINITIONS và location-service.")
    sys.exit(1)

  # ── Phase 6-9: Import products + listings ────────────────────────────────
  log.info("\n📦 Phase 6-9: Import %d products...", len(raw_products))
  success = import_products(api, raw_products, facilities)

  log.info("\n" + "="*60)
  log.info("✅ COMPLETE")
  log.info("  Sellers:   %d", len(authenticated))
  log.info("  Facilities:%d", len(facilities))
  log.info("  Products:  %d / %d", success, len(raw_products))
  log.info("="*60)

  return success


if __name__ == "__main__":
  count = main()
  print(f"\n🎉 Seed complete: {count} products imported into the system")
