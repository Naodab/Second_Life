#!/usr/bin/env python3
"""
Crawl data from the Tiki.vn API and save to JSON for seed_system.py.

Output: import_real_data/data/raw_products.json

Each product includes attribute value IDs aligned with attributes-seed.yml:
  Condition, Color, Brand, Usage Type, Origin, Warranty, Region, Capacity
plus manufactureYear on the product payload at import time.

Run (from import_real_data/):
  python3 crawl_tiki.py
"""
from __future__ import annotations

import json
import random
import logging
import time
from pathlib import Path

import requests

from attribute_maps import (
  detect_brand,
  detect_capacity,
  detect_color,
  detect_condition,
  detect_origin,
  detect_region,
  detect_warranty,
  parse_manufacture_year,
)

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

TIKI_API = "https://tiki.vn/api/v2/products"
PAGE_SIZE = 40
TARGET_TOTAL = 1000
OUTPUT_FILE = Path(__file__).parent / "data" / "raw_products.json"

HEADERS = {
  "User-Agent": (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
  ),
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
  "Referer": "https://tiki.vn/",
}

# Tiki category → Second Life sub-category
CATEGORY_MAP = [
  (1789, "sub-phone", "cat-electronics", "Điện thoại & Phụ kiện", "BUY"),
  (1846, "sub-laptop", "cat-electronics", "Máy tính & Laptop", "BUY"),
  (4221, "sub-tv", "cat-electronics", "Tivi & Màn hình", "BUY"),
  (1962, "sub-camera", "cat-electronics", "Máy ảnh & Quay phim", "BUY"),
  (1883, "sub-home-appliance", "cat-electronics", "Thiết bị gia dụng", "BUY"),
  (931, "sub-women-clothing", "cat-fashion", "Quần áo nữ", "BUY"),
  (915, "sub-men-clothing", "cat-fashion", "Quần áo nam", "BUY"),
  (6000, "sub-shoes", "cat-fashion", "Giày dép", "BUY"),
  (27498, "sub-bag", "cat-fashion", "Túi xách & Balo", "BUY"),
  (2549, "sub-furniture-living", "cat-home", "Nội thất phòng khách", "BUY"),
  (1703, "sub-kitchen", "cat-home", "Đồ dùng nhà bếp", "BUY"),
  (1686, "sub-baby-stuff", "cat-mother-baby", "Đồ dùng cho bé", "BUY"),
  (8594, "sub-fitness", "cat-sports", "Dụng cụ thể thao & Gym", "BUY"),
  (316, "sub-books", "cat-books", "Sách cũ", "BUY"),
  (2554, "sub-games", "cat-books", "Game & Console", "BUY"),
  (44792, "sub-cosmetics", "cat-beauty", "Mỹ phẩm & Skincare", "BUY"),
]

REGION_POOL = [
  "Tp Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Bình Dương",
  "Cần Thơ",
  "Hải Phòng",
  "Đồng Nai",
]


def _secondhand_price(original_price: int) -> int:
  if not original_price or original_price <= 0:
    return random.randint(50_000, 500_000)
  discount = random.uniform(0.35, 0.70)
  price = int(original_price * (1 - discount) / 1000) * 1000
  return max(price, 10_000)


def _build_description(product: dict) -> str:
  parts = []
  name = (product.get("name") or "").strip()
  short_desc = (product.get("short_description") or "").strip()
  description = (product.get("description") or "").strip()

  if short_desc and short_desc != name:
    parts.append(short_desc)
  if description:
    parts.append(description[:3000])
  if not parts:
    parts.append(f"Sản phẩm second-hand: {name}. Còn rất tốt, đầy đủ phụ kiện.")

  return "\n\n".join(parts)[:8000]


def _extract_images(product: dict) -> list[str]:
  urls: list[str] = []
  thumb = product.get("thumbnail_url") or product.get("thumbnail") or ""
  if thumb.startswith("http"):
    urls.append(thumb)

  for img in product.get("images") or []:
    if isinstance(img, str) and img.startswith("http") and img not in urls:
      urls.append(img)
    elif isinstance(img, dict):
      url = img.get("base_url") or img.get("url") or img.get("large_url") or ""
      if url.startswith("http") and url not in urls:
        urls.append(url)

  for img in product.get("gallery") or []:
    url = (img.get("base_url") or img.get("large_url") or "") if isinstance(img, dict) else ""
    if url.startswith("http") and url not in urls:
      urls.append(url)

  return urls[:8]


def fetch_category_page(cat_id: int, page: int) -> list[dict]:
  try:
    resp = requests.get(
      TIKI_API,
      params={
        "limit": PAGE_SIZE,
        "category": cat_id,
        "page": page,
        "platform": "web",
        "sort": "default",
      },
      headers=HEADERS,
      timeout=20,
    )
    if resp.status_code == 200:
      return resp.json().get("data") or []
    log.warning("  HTTP %d (cat=%d, page=%d)", resp.status_code, cat_id, page)
  except requests.RequestException as exc:
    log.error("  Request error (cat=%d, page=%d): %s", cat_id, page, exc)
  return []


def transform_product(
  item: dict,
  sub_cat_id: str,
  primary_cat_id: str,
  listing_type: str,
) -> dict | None:
  name = (item.get("name") or "").strip()
  if not name or len(name) < 3:
    return None

  original_price = item.get("price") or item.get("list_price") or 0
  price = _secondhand_price(original_price)

  images = _extract_images(item)
  if not images:
    return None

  description = _build_description(item)
  text = f"{name} {description}"
  region_name = random.choice(REGION_POOL)

  year = parse_manufacture_year(text)
  if year is None:
    year = random.randint(2019, 2025)

  return {
    "name": name[:255],
    "description": description,
    "primarySubCategoryId": sub_cat_id,
    "subCategoryIds": [sub_cat_id],
    "categoryId": primary_cat_id,
    "thumbnail": images[0],
    "images": images[1:],
    "listing_type": listing_type,
    "price": price,
    "manufactureYear": year,
    "region_name": region_name,
    "condition_val_id": detect_condition(text),
    "color_val_id": detect_color(text),
    "brand_val_id": detect_brand(text),
    "origin_val_id": detect_origin("Chính hãng"),
    "warranty_val_id": detect_warranty("Không bảo hành"),
    "region_val_id": detect_region(region_name),
    "capacity_val_id": detect_capacity(text),
    "_source": {
      "tiki_id": item.get("id"),
      "original_price": original_price,
    },
  }


def main() -> int:
  OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

  per_cat = max(5, TARGET_TOTAL // len(CATEGORY_MAP))
  log.info("Crawl Tiki: %d categories, ~%d/category (target %d)", len(CATEGORY_MAP), per_cat, TARGET_TOTAL)

  all_products: list[dict] = []
  seen_ids: set[int] = set()

  for cat_id, sub_cat_id, primary_cat_id, label, listing_type in CATEGORY_MAP:
    if len(all_products) >= TARGET_TOTAL:
      break

    target = min(per_cat, TARGET_TOTAL - len(all_products))
    log.info("▶ [%s] cat=%d (~%d items)", label, cat_id, target)

    cat_products: list[dict] = []
    page = 1
    while len(cat_products) < target:
      batch = fetch_category_page(cat_id, page)
      if not batch:
        break

      for item in batch:
        if len(cat_products) >= target:
          break
        tiki_id = item.get("id")
        if tiki_id in seen_ids:
          continue
        seen_ids.add(tiki_id)

        product = transform_product(item, sub_cat_id, primary_cat_id, listing_type)
        if product:
          cat_products.append(product)

      page += 1
      time.sleep(random.uniform(0.5, 1.2))

    all_products.extend(cat_products)
    log.info("  ✓ +%d (total %d)", len(cat_products), len(all_products))
    time.sleep(random.uniform(1.0, 2.0))

  with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

  log.info("Saved %d products → %s", len(all_products), OUTPUT_FILE)
  return len(all_products)


if __name__ == "__main__":
  count = main()
  print(f"\nCrawl complete: {count} products → {OUTPUT_FILE}")
