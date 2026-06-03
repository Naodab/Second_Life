#!/usr/bin/env python3
"""
Seed all data into the Second Life system.

Pipeline:
 1. Read raw_products.json (output from crawl_tiki.py)
 2. Register seller accounts via API
 3. Bypass email verification directly via MySQL
 4. Login to obtain JWT tokens
 5. Fetch province/ward codes from location API
 6. Create facilities
 7. Create products + upload images
 8. Publish products
 9. Create listings (BUY / RENT)

Run: python3 seed_system.py
Requires: docker compose running (or services running locally)
"""
from __future__ import annotations

import json
import time
import random
import logging
import sys
from pathlib import Path
from typing import Optional

import requests
import pymysql
import pymysql.cursors

from attribute_maps import ALL_ATTRIBUTE_IDS, build_variant

GATEWAY = "http://localhost:80/api/v1"
RAW_DATA_FILE = Path(__file__).parent / "data" / "raw_products.json"

MYSQL_HOST = ""
MYSQL_PORT = ""
MYSQL_USER = ""
MYSQL_PASSWORD = ""
MYSQL_DB = "defaultdb"

NUM_SELLERS = 8
SELLER_PASSWORD = "Seller@123456"

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
  handlers=[
    logging.StreamHandler(),
    logging.FileHandler("seed_system.log", encoding="utf-8"),
  ],
)
log = logging.getLogger(__name__)

# Wait time for Kafka to create profiles (seconds)
KAFKA_WAIT_SECS = 5

# Facilities per seller
FACILITIES_PER_SELLER = 2

SELLERS = [
  {"email": f"seller{i+1}@secondlife.dev", "password": SELLER_PASSWORD}
  for i in range(NUM_SELLERS)
]

# ──────────────────────────────────────────────────────────────────────────────
# Facility templates (each seller uses one of these)
# ──────────────────────────────────────────────────────────────────────────────
FACILITY_TEMPLATES = [
  {
    "name": "Cửa hàng Đồ cũ Thanh Xuân",
    "description": "Chuyên thu mua và bán đồ cũ chất lượng cao tại Hà Nội",
    "address": "15 Nguyễn Trãi, Thanh Xuân",
    "linkGoogleMap": "https://maps.google.com/?q=15+Nguyen+Trai,+Thanh+Xuan,+Hanoi",
  },
  {
    "name": "Second Life Store - Cầu Giấy",
    "description": "Điểm mua bán và cho thuê đồ cũ uy tín tại Cầu Giấy",
    "address": "23 Xuân Thủy, Cầu Giấy",
    "linkGoogleMap": "https://maps.google.com/?q=23+Xuan+Thuy,+Cau+Giay,+Hanoi",
  },
  {
    "name": "Chợ Đồ Cũ Bắc Từ Liêm",
    "description": "Nơi trao đổi đồ cũ lớn nhất quận Bắc Từ Liêm",
    "address": "56 Phạm Văn Đồng, Bắc Từ Liêm",
    "linkGoogleMap": "https://maps.google.com/?q=56+Pham+Van+Dong,+Bac+Tu+Liem,+Hanoi",
  },
  {
    "name": "Shop Đồ Cũ Quận 1 - HCM",
    "description": "Thu mua bán đồ cũ chính hãng tại Quận 1 TP.HCM",
    "address": "88 Lý Tự Trọng, Quận 1",
    "linkGoogleMap": "https://maps.google.com/?q=88+Ly+Tu+Trong,+Quan+1,+Ho+Chi+Minh",
  },
  {
    "name": "Đồ Cũ Quận 3 - Thành phố HCM",
    "description": "Chuyên bán điện tử, thời trang, nội thất đã qua sử dụng",
    "address": "34 Võ Văn Tần, Quận 3",
    "linkGoogleMap": "https://maps.google.com/?q=34+Vo+Van+Tan,+Quan+3,+Ho+Chi+Minh",
  },
  {
    "name": "Vintage & Second Hand - Đà Nẵng",
    "description": "Kinh doanh đồ cũ vintage phong cách tại Đà Nẵng",
    "address": "12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
    "linkGoogleMap": "https://maps.google.com/?q=12+Nguyen+Van+Linh,+Hai+Chau,+Da+Nang",
  },
  {
    "name": "Kho Đồ Cũ Hải Châu",
    "description": "Kho hàng đồ cũ lớn với nhiều mặt hàng đa dạng",
    "address": "45 Ông Ích Khiêm, Hải Châu, Đà Nẵng",
    "linkGoogleMap": "https://maps.google.com/?q=45+Ong+Ich+Khiem,+Hai+Chau,+Da+Nang",
  },
  {
    "name": "Phong Trào Đồ Cũ Bình Thạnh",
    "description": "Mua bán đồ điện tử, nội thất, thời trang đã qua sử dụng",
    "address": "102 Xô Viết Nghệ Tĩnh, Bình Thạnh",
    "linkGoogleMap": "https://maps.google.com/?q=102+Xo+Viet+Nghe+Tinh,+Binh+Thanh,+Ho+Chi+Minh",
  },
  {
    "name": "Đồ Cũ Đông Đô - Long Biên",
    "description": "Cung cấp đồ nội thất và thiết bị điện tử cũ giá tốt",
    "address": "78 Ngô Gia Tự, Long Biên, Hà Nội",
    "linkGoogleMap": "https://maps.google.com/?q=78+Ngo+Gia+Tu,+Long+Bien,+Hanoi",
  },
  {
    "name": "Cửa Hàng Tái Chế Phú Nhuận",
    "description": "Mua bán, thuê đồ cũ thân thiện môi trường tại Phú Nhuận",
    "address": "19 Phan Đình Phùng, Phú Nhuận",
    "linkGoogleMap": "https://maps.google.com/?q=19+Phan+Dinh+Phung,+Phu+Nhuan,+Ho+Chi+Minh",
  },
  {
    "name": "Second Life Hoàn Kiếm",
    "description": "Điểm hẹn của những người yêu đồ cũ tại trung tâm Hà Nội",
    "address": "5 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    "linkGoogleMap": "https://maps.google.com/?q=5+Dinh+Tien+Hoang,+Hoan+Kiem,+Hanoi",
  },
  {
    "name": "Kho Hàng Cũ Thủ Đức",
    "description": "Chuyên các loại đồ gia dụng và nội thất đã qua sử dụng",
    "address": "225 Kha Vạn Cân, Thủ Đức, TP.HCM",
    "linkGoogleMap": "https://maps.google.com/?q=225+Kha+Van+Can,+Thu+Duc,+Ho+Chi+Minh",
  },
  {
    "name": "Recycled Goods - Sơn Trà",
    "description": "Đồ cũ chất lượng giá sinh viên khu vực Sơn Trà Đà Nẵng",
    "address": "33 Dương Tự Minh, Sơn Trà, Đà Nẵng",
    "linkGoogleMap": "https://maps.google.com/?q=33+Duong+Tu+Minh,+Son+Tra,+Da+Nang",
  },
  {
    "name": "Xưởng Thu Mua Đồ Cũ Tân Bình",
    "description": "Xưởng thu mua và tân trang đồ cũ quy mô lớn",
    "address": "67 Cộng Hòa, Tân Bình, TP.HCM",
    "linkGoogleMap": "https://maps.google.com/?q=67+Cong+Hoa,+Tan+Binh,+Ho+Chi+Minh",
  },
  {
    "name": "Phố Đồ Cũ Đống Đa",
    "description": "Phố mua bán đồ cũ sôi động nhất quận Đống Đa",
    "address": "89 Tây Sơn, Đống Đa, Hà Nội",
    "linkGoogleMap": "https://maps.google.com/?q=89+Tay+Son,+Dong+Da,+Hanoi",
  },
  {
    "name": "Green Shop - Đồ Cũ Gò Vấp",
    "description": "Mua bán đồ cũ thân thiện với môi trường tại Gò Vấp",
    "address": "144 Nguyễn Kiệm, Gò Vấp, TP.HCM",
    "linkGoogleMap": "https://maps.google.com/?q=144+Nguyen+Kiem,+Go+Vap,+Ho+Chi+Minh",
  },
]

# Valid province & ward codes (from location service)
# Queried from API at runtime; these are fallbacks
LOCATION_PRESETS = [
  {"provinceCode": "01", "wardCode": "00001"},  # Hà Nội
  {"provinceCode": "79", "wardCode": "26734"},  # TP.HCM
  {"provinceCode": "48", "wardCode": "20194"},  # Đà Nẵng
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


def db_connect():
  return pymysql.connect(
    host=MYSQL_HOST,
    port=MYSQL_PORT,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DB,
    ssl={"ssl_disabled": False},
    cursorclass=pymysql.cursors.DictCursor,
    connect_timeout=10,
  )


def get_location_codes(api: APIClient) -> list[dict]:
  """Fetch valid province/ward codes from the location API."""
  try:
    provinces_resp = api.get("/provinces", params={"page": 0, "pageSize": 10})
    provinces = provinces_resp.get("data") or []
    locations = []
    for prov in provinces[:3]:
      p_code = prov.get("code") or prov.get("provinceCode")
      if not p_code:
        continue
      try:
        wards_resp = api.get(f"/provinces/{p_code}/wards", params={"pageSize": 5})
        wards = wards_resp.get("data") or []
        for ward in wards[:2]:
          w_code = ward.get("code") or ward.get("wardCode")
          if w_code:
            locations.append({"provinceCode": p_code, "wardCode": w_code})
      except Exception:
        pass
    if locations:
      log.info("Fetched %d location codes from API", len(locations))
      return locations
  except Exception as exc:
    log.warning("Could not fetch locations from API (%s), using fallback", exc)
  return LOCATION_PRESETS


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
# Phase 2 – Bypass email verification via MySQL
# ──────────────────────────────────────────────────────────────────────────────
def bypass_email_verification(emails: list[str]) -> dict[str, Optional[str]]:
  """
  Set email_verified=1 in MySQL.
  Returns dict {email → profile_id}.
  """
  result: dict[str, Optional[str]] = {}
  if not emails:
    log.warning("  ~ No emails to verify")
    return result
  try:
    conn = db_connect()
    with conn:
      with conn.cursor() as cur:
        placeholders = ", ".join(["%s"] * len(emails))
        cur.execute(
          f"UPDATE accounts SET email_verified = 1 WHERE email IN ({placeholders})",
          emails,
        )
        conn.commit()
        log.info("  ✓ Set email_verified=1 for %d accounts", cur.rowcount)

        # Fetch profile_id
        cur.execute(
          f"SELECT email, profile_id FROM accounts WHERE email IN ({placeholders})",
          emails,
        )
        rows = cur.fetchall()
        for row in rows:
          result[row["email"]] = row.get("profile_id")
  except Exception as exc:
    log.error("  ✗ DB error: %s", exc)
  return result


# ──────────────────────────────────────────────────────────────────────────────
# Phase 3 – Login
# ──────────────────────────────────────────────────────────────────────────────
def login_sellers(api: APIClient, sellers: list[dict]) -> list[dict]:
  """
  Login and return list of {email, token, profile_id}.
  Retry up to 3 times if profile is not ready yet (Kafka still creating it).
  """
  authenticated = []
  for seller in sellers:
    for attempt in range(3):
      try:
        resp = api.post("/auth/login", seller)
        data = resp.get("data") or resp
        token = data.get("accessToken")
        profile = data.get("profile") or {}
        profile_id = profile.get("id")
        if token and profile_id:
          log.info("  ✓ Login: %s (profile=%s)", seller["email"], profile_id)
          authenticated.append({
            "email": seller["email"],
            "token": token,
            "profile_id": profile_id,
          })
          break
        else:
          log.warning("  ~ Empty token/profile for %s, retrying...", seller["email"])
      except requests.HTTPError as e:
        log.warning("  ~ Login attempt %d failed for %s: %s", attempt + 1, seller["email"], e)
      time.sleep(KAFKA_WAIT_SECS)
    else:
      log.error("  ✗ Login failed: %s", seller["email"])

  return authenticated


# ──────────────────────────────────────────────────────────────────────────────
# Phase 4 – Create facilities
# ──────────────────────────────────────────────────────────────────────────────
def create_facilities(api: APIClient, sellers: list[dict], locations: list[dict]) -> list[dict]:
  """
  Insert facilities directly into MySQL to bypass location validation
  (FacilityCreateRequest has no lat/lng → validLocation always fails via API).
  """
  import uuid as uuid_module
  from datetime import datetime

  facilities = []
  template_pool = FACILITY_TEMPLATES.copy()
  random.shuffle(template_pool)
  tpl_idx = 0
  now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

  # Province center coordinates for DB storage (reference only, not validated)
  PROVINCE_COORDS = {
    "01": (21.0285, 105.8542),   # Hà Nội
    "79": (10.8231, 106.6297),   # TP.HCM
    "48": (16.0544, 108.2022),   # Đà Nẵng
  }

  try:
    conn = db_connect()
  except Exception as exc:
    log.error("  ✗ Could not connect to DB: %s", exc)
    return []

  with conn:
    with conn.cursor() as cur:
      # Load facilities that already exist in DB (from a previous run)
      all_profile_ids = [s["profile_id"] for s in sellers]
      if all_profile_ids:
        placeholders = ", ".join(["%s"] * len(all_profile_ids))
        cur.execute(
          f"SELECT id, owner_id FROM facilities "
          f"WHERE owner_id IN ({placeholders}) AND deleted_at IS NULL",
          all_profile_ids,
        )
        existing_rows = cur.fetchall()
        if existing_rows:
          log.info("  ~ Found %d existing facilities in DB, skipping creation", len(existing_rows))
          # Map owner_id → seller info
          seller_by_profile = {s["profile_id"]: s for s in sellers}
          for row in existing_rows:
            owner = seller_by_profile.get(row["owner_id"])
            if owner:
              facilities.append({
                "facility_id":  row["id"],
                "seller_token": owner["token"],
                "profile_id":   owner["profile_id"],
              })
          log.info("  ✓ Loaded %d facilities from DB", len(facilities))
          return facilities

      for seller in sellers:
        for _ in range(FACILITIES_PER_SELLER):
          tpl = template_pool[tpl_idx % len(template_pool)]
          tpl_idx += 1
          loc = random.choice(locations)
          p_code = loc["provinceCode"]
          lat, lon = PROVINCE_COORDS.get(p_code, (16.0, 108.0))
          # Add slight noise so stores do not share identical coordinates
          lat += random.uniform(-0.05, 0.05)
          lon += random.uniform(-0.05, 0.05)

          fac_id = str(uuid_module.uuid4())
          try:
            cur.execute("""
              INSERT INTO facilities
               (id, name, owner_id, description, link_google_map,
               address, province_code, ward_code,
               latitude, longitude,
               is_active, view_count, order_count, average_rating,
               created_at, updated_at)
              VALUES
               (%s, %s, %s, %s, %s,
               %s, %s, %s,
               %s, %s,
               1, 0, 0, 0.0,
               %s, %s)
            """, (
              fac_id,
              tpl["name"],
              seller["profile_id"],
              tpl.get("description", ""),
              tpl["linkGoogleMap"],
              tpl["address"],
              p_code,
              loc["wardCode"],
              lat, lon,
              now, now,
            ))
            conn.commit()
            log.info("  ✓ Facility [%s] → %s", tpl["name"], fac_id)
            facilities.append({
              "facility_id":  fac_id,
              "seller_token": seller["token"],
              "profile_id":   seller["profile_id"],
            })
          except Exception as exc:
            conn.rollback()
            log.error("  ✗ Insert facility failed: %s", exc)

  log.info("Total facilities: %d", len(facilities))
  return facilities


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
  fac_pool = facilities.copy()

  for i, raw in enumerate(raw_products):
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

  return success_count


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
  if not RAW_DATA_FILE.exists():
    log.error("File not found: %s – run crawl_chotot.py first!", RAW_DATA_FILE)
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

  # ── Phase 2: Bypass email verification ──────────────────────────────────
  log.info("\n🔓 Phase 2: Bypass email verification qua MySQL...")
  emails = [s["email"] for s in registered]
  profile_map = bypass_email_verification(emails)
  log.info("Email verified for: %s", list(profile_map.keys()))

  # Wait for Kafka to finish creating profiles
  log.info("Waiting %ds for Kafka to create profiles...", KAFKA_WAIT_SECS)
  time.sleep(KAFKA_WAIT_SECS)

  # ── Phase 3: Login ───────────────────────────────────────────────────────
  log.info("\n🔑 Phase 3: Login...")
  authenticated = login_sellers(api, registered)
  if not authenticated:
    log.error("No sellers logged in! Stopping.")
    sys.exit(1)
  log.info("Logged-in sellers: %d", len(authenticated))

  # ── Phase 4: Locations ───────────────────────────────────────────────────
  log.info("\n📍 Phase 4: Fetch location codes...")
  locations = get_location_codes(api)
  log.info("Using %d locations: %s", len(locations), locations)

  # ── Phase 5: Create facilities ──────────────────────────────────────────────
  log.info("\n🏪 Phase 5: Create facilities...")
  facilities = create_facilities(api, authenticated, locations)
  if not facilities:
    log.error("No facilities created! Stopping.")
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
