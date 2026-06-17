#!/usr/bin/env python3
"""
Resume product import from where it was interrupted.
Skips phases: register, email verify, create facilities (already done).
Only re-login + import from START_FROM to end.

Run:
  python3 resume_import.py          # start from item 350 (default)
  python3 resume_import.py 400      # start from item 400
"""
from __future__ import annotations

import json
import sys
import time
import random
import logging
from pathlib import Path

import requests

from attribute_maps import attribute_ids_for_sub_category, build_variant
from seed_api import load_existing_facilities

GATEWAY = "http://localhost:80/api/v1"
RAW_DATA_FILE = Path(__file__).parent / "data" / "raw_products.json"

NUM_SELLERS = 3
SELLER_PASSWORD = "Seller@123456"

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
  handlers=[
    logging.StreamHandler(),
    logging.FileHandler("resume_import.log", encoding="utf-8"),
  ],
)
log = logging.getLogger(__name__)

SELLERS = [
  {"email": f"seller{i+1}@secondlife.dev", "password": SELLER_PASSWORD}
  for i in range(NUM_SELLERS)
]

# Higher timeout to avoid failures when server is busy
REQUEST_TIMEOUT = 60   # seconds (increased from 15s → 60s)
RETRY_ON_TIMEOUT = 3   # retry count on timeout


# ──────────────────────────────────────────────────────────────────────────────
# API Client (increased timeout)
# ──────────────────────────────────────────────────────────────────────────────
class APIClient:
  def __init__(self, base_url: str):
    self.base = base_url
    self.session = requests.Session()
    self.session.headers.update({"Content-Type": "application/json"})

  def _url(self, path: str) -> str:
    return f"{self.base}/{path.lstrip('/')}"

  def get(self, path: str, params: dict = None, **kwargs) -> dict:
    r = self.session.get(self._url(path), params=params, timeout=REQUEST_TIMEOUT, **kwargs)
    r.raise_for_status()
    return r.json()

  def post(self, path: str, json_body: dict = None, **kwargs) -> dict:
    r = self.session.post(self._url(path), json=json_body, timeout=REQUEST_TIMEOUT, **kwargs)
    r.raise_for_status()
    return r.json()

  def with_auth(self, token: str) -> "APIClient":
    c = APIClient(self.base)
    c.session.headers.update({"Authorization": f"Bearer {token}"})
    return c


# ──────────────────────────────────────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────────────────────────────────────
def login_sellers(api: APIClient) -> list[dict]:
  """Login với sellers đã có sẵn, trả về list {email, token, profile_id}."""
  authenticated = []
  for seller in SELLERS:
    try:
      resp = api.post("/auth/login", seller)
      data = resp.get("data") or resp
      token = data.get("accessToken")
      profile = data.get("profile") or {}
      profile_id = profile.get("id")
      if token and profile_id:
        log.info("  ✓ Login: %s (profile=%s)", seller["email"], profile_id)
        authenticated.append({
          "email":      seller["email"],
          "token":      token,
          "profile_id": profile_id,
        })
      else:
        log.warning("  ~ Empty token/profile for %s", seller["email"])
    except requests.HTTPError as e:
      log.error("  ✗ Login failed %s: %s",
           seller["email"],
           e.response.text if e.response else e)
  return authenticated


# ──────────────────────────────────────────────────────────────────────────────
# Load existing facilities (API)
# ──────────────────────────────────────────────────────────────────────────────
def load_facilities(authenticated: list[dict], api: APIClient) -> list[dict]:
  facilities = load_existing_facilities(api, authenticated)
  log.info("Loaded %d facilities via API", len(facilities))
  return facilities


def build_listing_variant(product_variant_id: str, listing_type: str, price: float) -> dict:
  variant: dict = {
    "productVariantId": product_variant_id,
    "quantity":  random.randint(1, 5),
    "isActive":  True,
  }
  if listing_type == "BUY":
    variant["buyPrice"] = max(price, 10_000)
  elif listing_type == "RENT":
    variant["rentPrice"] = max(price, 5_000)
    variant["rentUnit"]  = random.choice(["DAY", "HOUR", "MONTH"])
  else:
    variant["buyPrice"] = max(price, 10_000)
  return variant


# ──────────────────────────────────────────────────────────────────────────────
# Import (với retry khi timeout)
# ──────────────────────────────────────────────────────────────────────────────
def post_with_retry(api: APIClient, path: str, payload: dict = None, **kwargs) -> dict:
  """POST với retry tự động khi gặp timeout."""
  last_err = None
  for attempt in range(RETRY_ON_TIMEOUT):
    try:
      return api.post(path, payload, **kwargs)
    except requests.exceptions.Timeout as e:
      last_err = e
      wait = 5 * (attempt + 1)
      log.warning("  Timeout attempt %d/%d, waiting %ds before retry...",
            attempt + 1, RETRY_ON_TIMEOUT, wait)
      time.sleep(wait)
    except requests.HTTPError:
      raise  # HTTP error → không retry
  raise last_err  # type: ignore[misc]


def import_products(api: APIClient, raw_products: list[dict], facilities: list[dict],
          start_from: int = 0) -> int:
  if not facilities:
    log.error("No facilities available!")
    return 0

  total       = len(raw_products)
  to_import   = raw_products[start_from:]
  success_count = 0

  log.info("Import from item %d → %d (%d products remaining)", start_from, total - 1, len(to_import))

  for offset, raw in enumerate(to_import):
    i = start_from + offset   # actual index in the full list

    fac          = facilities[i % len(facilities)]
    auth_api     = api.with_auth(fac["seller_token"])
    extra_headers = {"X-Profile-Id": fac["profile_id"]}

    name         = (raw.get("name") or "").strip() or "Sản phẩm không tên"
    thumbnail    = raw.get("thumbnail") or ""
    images       = raw.get("images") or []
    listing_type = raw.get("listing_type") or "BUY"
    price        = float(raw.get("price") or 100_000)

    # ── Step 1: Create product ────────────────────────────────────────────
    product_payload = {
      "name":                 name[:255],
      "description":          (raw.get("description") or name)[:8000],
      "primarySubCategoryId": raw.get("primarySubCategoryId", "sub-phone"),
      "subCategoryIds":       raw.get("subCategoryIds", ["sub-phone"]),
      "attributeIds":         attribute_ids_for_sub_category(raw.get("primarySubCategoryId", "")),
      "variants":             [build_variant(raw, listing_type)],
    }
    if raw.get("manufactureYear"):
      product_payload["manufactureYear"] = int(raw["manufactureYear"])

    try:
      resp       = post_with_retry(auth_api, "/products", product_payload, headers=extra_headers)
      product    = resp.get("data") or resp
      product_id = product.get("id")
      if not product_id:
        log.warning("  [%d] Could not get product_id, skipping", i)
        continue
    except requests.HTTPError as e:
      log.error("  [%d] Create product failed HTTP %s: %s",
           i, e.response.status_code if e.response else "?",
           (e.response.text if e.response else str(e))[:200])
      continue
    except Exception as e:
      log.error("  [%d] Create product exception: %s", i, e)
      continue

    # ── Step 2: Upload images ────────────────────────────────────────────
    if thumbnail or images:
      image_payload = {
        "thumbnailUrl":     thumbnail or (images[0] if images else ""),
        "productImageUrls": images[:9],
        "videoUrl":         "",
      }
      try:
        post_with_retry(auth_api, f"/products/{product_id}/images",
                image_payload, headers=extra_headers)
      except Exception as e:
        log.warning("  [%d] Upload images failed: %s", i, e)

    # ── Step 3: Publish ──────────────────────────────────────────────
    try:
      post_with_retry(auth_api, f"/products/{product_id}/publish", headers=extra_headers)
    except Exception as e:
      log.warning("  [%d] Publish failed: %s – skipping listing", i, e)
      continue

    time.sleep(0.5)   # wait for DB / Kafka

    # ── Step 4: Fetch variants ─────────────────────────────────────────
    try:
      vresp    = auth_api.get(f"/products/{product_id}/variants", headers=extra_headers)
      variants = vresp.get("data") or []
    except Exception:
      variants = []

    if not variants:
      log.warning("  [%d] No variants after publish, skipping listing", i)
      continue

    # ── Step 5: Create listing ──────────────────────────────────────────
    listing_variants = [
      build_listing_variant(v["id"], listing_type, price)
      for v in variants if v.get("id")
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
      post_with_retry(auth_api, "/listings", listing_payload, headers=extra_headers)
      success_count += 1
    except requests.HTTPError as e:
      err_body = ""
      if e.response is not None:
        try:
          err_body = e.response.json()
        except Exception:
          err_body = e.response.text
      log.error("  [%d] Create listing failed HTTP %s | %s",
           i, e.response.status_code if e.response else "?", err_body)
    except Exception as e:
      log.error("  [%d] Create listing exception: %s", i, e)

    # Progress log mỗi 50 items
    if (offset + 1) % 50 == 0:
      done = start_from + offset + 1
      log.info("  Progress: %d/%d | success: %d", done, total, success_count)

  return success_count


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
  start_from = int(sys.argv[1]) if len(sys.argv) > 1 else 350

  log.info("="*60)
  log.info("RESUME IMPORT – starting from item %d", start_from)
  log.info("="*60)

  # Đọc data
  with open(RAW_DATA_FILE, encoding="utf-8") as f:
    raw_products: list[dict] = json.load(f)
  log.info("Total products in file: %d", len(raw_products))

  if start_from >= len(raw_products):
    log.error("start_from=%d >= total=%d, nothing to import", start_from, len(raw_products))
    sys.exit(1)

  api = APIClient(GATEWAY)

  # Login
  log.info("\n🔑 Login sellers...")
  authenticated = login_sellers(api)
  if not authenticated:
    log.error("No sellers logged in! Stopping.")
    sys.exit(1)
  log.info("Logged-in sellers: %d", len(authenticated))

  # Load facilities từ DB
  log.info("\n🏪 Load facilities via API...")
  facilities = load_facilities(authenticated, api)
  if not facilities:
    log.error("Could not load any facilities! Run seed_system.py first.")
    sys.exit(1)
  log.info("Facilities: %d", len(facilities))

  # Import
  log.info("\n📦 Import %d products (from item %d)...",
      len(raw_products) - start_from, start_from)
  success = import_products(api, raw_products, facilities, start_from=start_from)

  log.info("\n" + "="*60)
  log.info("✅ COMPLETE")
  log.info("  Import from: item %d", start_from)
  log.info("  Success:     %d / %d", success, len(raw_products) - start_from)
  log.info("="*60)

  return success


if __name__ == "__main__":
  count = main()
  print(f"\n🎉 Resume import complete: {count} products")
