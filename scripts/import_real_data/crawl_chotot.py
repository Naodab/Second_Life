#!/usr/bin/env python3
"""
Crawl data from the Chợ Tốt API and save to JSON.
Output: import_real_data/data/raw_products.json

Run (from import_real_data/):
  python3 crawl_chotot.py
"""
from __future__ import annotations

import json
import time
import random
import logging
from pathlib import Path

import requests

from attribute_maps import (
  detect_brand,
  detect_color,
  detect_condition,
  detect_origin,
  detect_region,
  detect_warranty,
  detect_capacity,
  parse_manufacture_year,
)

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────
CHOTOT_API = "https://gateway.chotot.com/v1/public/ad-listing"
PAGE_SIZE = 50
TARGET_TOTAL = 1000
OUTPUT_FILE = Path(__file__).parent / "data" / "raw_products.json"

HEADERS = {
  "User-Agent": (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
  ),
  "Accept": "application/json",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
  "Referer": "https://www.chotot.com/",
}

# ──────────────────────────────────────────────────────────────────────────────
# Mapping: Chợ Tốt category → our system subCategoryId
# ──────────────────────────────────────────────────────────────────────────────
# Each entry: (chotot_cg_code, our_sub_category_id, our_primary_category_id, label)
CATEGORY_MAP = [
  # Electronics
  (2000,   "sub-phone",             "cat-electronics", "Điện thoại & Phụ kiện"),
  (9000,   "sub-laptop",            "cat-electronics", "Laptop & Máy tính"),
  (11000,  "sub-tablet",            "cat-electronics", "Máy tính bảng"),
  (5010,   "sub-tv",                "cat-electronics", "Tivi & Màn hình"),
  (5020,   "sub-camera",            "cat-electronics", "Máy ảnh & Quay phim"),
  (5000,   "sub-home-appliance",    "cat-electronics", "Thiết bị gia dụng"),
  # Fashion
  (12000,  "sub-women-clothing",    "cat-fashion",     "Quần áo nữ"),
  (13000,  "sub-men-clothing",      "cat-fashion",     "Quần áo nam"),
  (14000,  "sub-kids-clothing",     "cat-fashion",     "Đồ trẻ em"),
  (15000,  "sub-shoes",             "cat-fashion",     "Giày dép"),
  (16000,  "sub-bag",               "cat-fashion",     "Túi xách & Balo"),
  # Home & Furniture
  (100000, "sub-furniture-living",  "cat-home",        "Nội thất phòng khách"),
  (100010, "sub-furniture-bedroom", "cat-home",        "Nội thất phòng ngủ"),
  (100020, "sub-kitchen",           "cat-home",        "Đồ dùng nhà bếp"),
  (100030, "sub-home-decor",        "cat-home",        "Trang trí nhà cửa"),
  # Vehicles
  (3000,   "sub-motorcycle",        "cat-vehicle",     "Xe máy"),
  (4000,   "sub-car",               "cat-vehicle",     "Ô tô"),
  (5100,   "sub-bike",              "cat-vehicle",     "Xe đạp & Xe điện"),
  # Mother & Baby
  (7000,   "sub-baby-stuff",        "cat-mother-baby", "Đồ dùng cho bé"),
  (8000,   "sub-toys",              "cat-mother-baby", "Đồ chơi trẻ em"),
  # Sports
  (6000,   "sub-fitness",           "cat-sports",      "Dụng cụ thể thao & Gym"),
  (6010,   "sub-camping",           "cat-sports",      "Đồ cắm trại & Du lịch"),
  # Books & Entertainment
  (17000,  "sub-books",             "cat-books",       "Sách cũ"),
  (18000,  "sub-games",             "cat-books",       "Game & Console"),
  # Beauty
  (19000,  "sub-cosmetics",         "cat-beauty",      "Mỹ phẩm & Skincare"),
]

def _detect_listing_type(ad: dict) -> str:
  """BUY or RENT based on price_string or category."""
  price_string = str(ad.get("price_string", "") or "").lower()
  subject = str(ad.get("subject", "") or "").lower()
  if any(kw in subject for kw in ["cho thuê", "thuê", "rent"]):
    return "RENT"
  if any(kw in price_string for kw in ["/tháng", "/ngày", "/giờ", "tháng"]):
    return "RENT"
  return "BUY"


def _normalize_images(ad: dict) -> list[str]:
  """Return image URLs from a single ad."""
  images = ad.get("images") or []
  urls = []
  for img in images:
    if isinstance(img, str) and img.startswith("http"):
      urls.append(img)
    elif isinstance(img, dict):
      url = img.get("url") or img.get("image_url") or ""
      if url.startswith("http"):
        urls.append(url)
  if not urls:
    # thumbnail fallback
    thumb = ad.get("thumbnail") or ad.get("avatar") or ""
    if thumb.startswith("http"):
      urls.append(thumb)
  return urls[:10]  # max 10 images


def fetch_category(cg: int, label: str, max_items: int) -> list[dict]:
  """Fetch up to max_items ads from one category."""
  ads = []
  offset = 0
  while len(ads) < max_items:
    try:
      resp = requests.get(
        CHOTOT_API,
        params={"cg": cg, "o": offset, "page_size": PAGE_SIZE},
        headers=HEADERS,
        timeout=15,
      )
      if resp.status_code != 200:
        log.warning("  [%s] HTTP %d at offset %d – skipping", label, resp.status_code, offset)
        break
      data = resp.json()
      batch = data.get("ads") or data.get("data") or []
      if not batch:
        break
      ads.extend(batch)
      log.info("  [%s] Fetched %d/%d (offset=%d)", label, len(ads), max_items, offset)
      if len(batch) < PAGE_SIZE:
        break
      offset += PAGE_SIZE
      time.sleep(random.uniform(0.8, 1.5))
    except requests.RequestException as exc:
      log.error("  [%s] Request error: %s", label, exc)
      break

  return ads[:max_items]


def transform_ad(ad: dict, sub_cat_id: str, primary_cat_id: str) -> dict | None:
  """Transform one Chợ Tốt ad into the system's raw product format."""
  subject = (ad.get("subject") or "").strip()
  if not subject or len(subject) < 5:
    return None

  price = ad.get("price") or 0
  body = (ad.get("body") or "").strip()
  images = _normalize_images(ad)

  listing_type = _detect_listing_type(ad)
  text = f"{subject} {body}"
  region_name = ad.get("region_name") or ad.get("area_name") or ""

  # Require at least one image
  thumbnail = images[0] if images else ""
  extra_images = images[1:] if len(images) > 1 else []

  return {
    "name": subject[:255],
    "description": body[:8000] or f"Sản phẩm {subject}",
    "primarySubCategoryId": sub_cat_id,
    "subCategoryIds": [sub_cat_id],
    "categoryId": primary_cat_id,
    "thumbnail": thumbnail,
    "images": extra_images,
    "listing_type": listing_type,
    "price": price,
    "manufactureYear": parse_manufacture_year(body),
    "region_name": region_name,
    "condition_val_id": detect_condition(text),
    "color_val_id": detect_color(text),
    "brand_val_id": detect_brand(text),
    "origin_val_id": detect_origin(""),
    "warranty_val_id": detect_warranty(""),
    "region_val_id": detect_region(region_name),
    "capacity_val_id": detect_capacity(text),
    "_source": {
      "list_id": ad.get("list_id"),
      "region": region_name,
      "category_code": ad.get("category"),
    },
  }


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
  OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

  total_cats = len(CATEGORY_MAP)
  per_cat = max(1, TARGET_TOTAL // total_cats)
  log.info("Starting crawl: %d categories, ~%d items/category (total ~%d)", total_cats, per_cat, TARGET_TOTAL)

  all_products: list[dict] = []

  for cg, sub_cat_id, primary_cat_id, label in CATEGORY_MAP:
    remaining = TARGET_TOTAL - len(all_products)
    if remaining <= 0:
      break

    fetch_count = min(per_cat, remaining)
    log.info("▶ Crawl [%s] (cg=%d), fetching %d items...", label, cg, fetch_count)
    ads = fetch_category(cg, label, fetch_count)

    for ad in ads:
      product = transform_ad(ad, sub_cat_id, primary_cat_id)
      if product:
        all_products.append(product)

    log.info("  ✓ %d valid products, total: %d", len(ads), len(all_products))
    time.sleep(random.uniform(1.0, 2.0))

  log.info("Total crawled: %d products", len(all_products))

  with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

  log.info("✅ Saved to: %s", OUTPUT_FILE)
  return len(all_products)


if __name__ == "__main__":
  count = main()
  print(f"\n🎉 Crawl complete: {count} products → {OUTPUT_FILE}")
