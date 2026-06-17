#!/usr/bin/env python3
"""
Crawl data from the Chợ Tốt API and save to JSON.
Output: import_real_data/data/raw_products.json

Điện thoại KHÔNG crawl từ Chợ Tốt — lấy từ pricing/phone_tablet_dataset.csv (mặc định 3000).

Run (from import_real_data/):
  python3 crawl_chotot.py
  python3 crawl_chotot.py --phones 3000
  python3 crawl_chotot.py --target 500 --phones 3000 --merge-phones
  python3 import_phones_from_pricing.py --limit 3000   # chỉ phones, không crawl
"""
from __future__ import annotations

import argparse
import json
import logging
import random
import sys
import time
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
from category_registry import normalize_product_categories
from chotot_import_config import (
  CHOTOT_API_LIST,
  DEFAULT_PER_CATEGORY,
  DEFAULT_PHONE_TARGET,
  DEFAULT_TARGET_TOTAL,
  HEADERS,
  IMPORT_CATEGORIES,
  ImportCategory,
)
from fix_categories import apply_category_fix, log_stats

_PRICING_DIR = Path(__file__).resolve().parent.parent / "pricing"
if str(_PRICING_DIR) not in sys.path:
  sys.path.insert(0, str(_PRICING_DIR))

from category_remap import resolve_mapping_from_ad  # noqa: E402
from chotot_config import CategoryMapping  # noqa: E402

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

PAGE_SIZE = 50
OUTPUT_FILE = Path(__file__).parent / "data" / "raw_products.json"


def parse_args() -> argparse.Namespace:
  p = argparse.ArgumentParser(description="Crawl Chợ Tốt → raw_products.json (+ phones từ pricing)")
  p.add_argument(
    "--target",
    type=int,
    default=DEFAULT_TARGET_TOTAL,
    help="Tổng sản phẩm crawl Chợ Tốt (không gồm điện thoại, 0 = bỏ qua crawl)",
  )
  p.add_argument(
    "--phones",
    type=int,
    default=DEFAULT_PHONE_TARGET,
    help="Số điện thoại lấy từ pricing CSV (0 = không import phones)",
  )
  p.add_argument(
    "--merge-phones",
    action="store_true",
    help="Giữ sản phẩm không phải điện thoại đã có trong output khi thêm phones",
  )
  p.add_argument(
    "--per-cat",
    type=int,
    default=DEFAULT_PER_CATEGORY,
    help="Số tin/category (0 = auto = target / số category)",
  )
  p.add_argument("--output", type=Path, default=OUTPUT_FILE)
  p.add_argument(
    "--no-strict",
    action="store_true",
    help="Giữ sản phẩm không match rule phân loại (mặc định: loại bỏ)",
  )
  return p.parse_args()


def _detect_listing_type(ad: dict) -> str:
  price_string = str(ad.get("price_string", "") or "").lower()
  subject = str(ad.get("subject", "") or "").lower()
  if any(kw in subject for kw in ["cho thuê", "thuê", "rent"]):
    return "RENT"
  if any(kw in price_string for kw in ["/tháng", "/ngày", "/giờ", "tháng"]):
    return "RENT"
  return "BUY"


def _normalize_images(ad: dict) -> list[str]:
  images = ad.get("images") or []
  urls: list[str] = []
  for img in images:
    if isinstance(img, str) and img.startswith("http"):
      urls.append(img)
    elif isinstance(img, dict):
      url = img.get("url") or img.get("image_url") or ""
      if url.startswith("http"):
        urls.append(url)
  if not urls:
    thumb = ad.get("thumbnail") or ad.get("avatar") or ""
    if thumb.startswith("http"):
      urls.append(thumb)
  return urls[:10]


def fetch_category(cg: int, label: str, max_items: int) -> list[dict]:
  ads: list[dict] = []
  offset = 0
  while len(ads) < max_items:
    try:
      resp = requests.get(
        CHOTOT_API_LIST,
        params={"cg": cg, "o": offset, "limit": PAGE_SIZE, "page_size": PAGE_SIZE},
        headers=HEADERS,
        timeout=20,
      )
      if resp.status_code != 200:
        log.warning("  [%s] HTTP %d at offset %d – skip", label, resp.status_code, offset)
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
      time.sleep(random.uniform(0.8, 1.4))
    except requests.RequestException as exc:
      log.error("  [%s] Request error: %s", label, exc)
      break
  return ads[:max_items]


def _crawl_mapping(cat: ImportCategory) -> CategoryMapping:
  return CategoryMapping(
    chotot_cg=cat.chotot_cg,
    chotot_name=cat.label,
    sl_category_id=cat.category_id,
    sl_category_name="",
    sl_sub_category_id=cat.sub_category_id,
    sl_sub_category_name="",
  )


def transform_ad(ad: dict, crawl_cat: ImportCategory) -> dict | None:
  subject = (ad.get("subject") or "").strip()
  if not subject or len(subject) < 5:
    return None

  images = _normalize_images(ad)
  if not images:
    return None

  body = (ad.get("body") or "").strip()
  listing_type = _detect_listing_type(ad)
  text = f"{subject} {body}"
  region_name = ad.get("region_name") or ad.get("area_name") or ""

  crawl_mapping = _crawl_mapping(crawl_cat)
  resolved = resolve_mapping_from_ad(ad, crawl_mapping)
  sub_cat_id = resolved.sl_sub_category_id
  primary_cat_id = resolved.sl_category_id

  product = {
    "name": subject[:255],
    "description": body[:8000] or f"Sản phẩm {subject}",
    "primarySubCategoryId": sub_cat_id,
    "subCategoryIds": [sub_cat_id],
    "categoryId": primary_cat_id,
    "thumbnail": images[0],
    "images": images[1:],
    "listing_type": listing_type,
    "price": ad.get("price") or 0,
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
      "chotot_cg": crawl_cat.chotot_cg,
      "crawl_sub": crawl_cat.sub_category_id,
      "resolved_sub": sub_cat_id,
    },
  }
  if not normalize_product_categories(product):
    return None
  return product


def dedupe_products(products: list[dict]) -> list[dict]:
  seen: set[str] = set()
  out: list[dict] = []
  for p in products:
    src = p.get("_source") or {}
    key = str(src.get("list_id") or "").strip() or p.get("name", "").strip().lower()
    if not key or key in seen:
      continue
    seen.add(key)
    out.append(p)
  return out


def main() -> int:
  args = parse_args()
  args.output.parent.mkdir(parents=True, exist_ok=True)

  categories = IMPORT_CATEGORIES
  per_cat = args.per_cat or (max(1, args.target // len(categories)) if args.target > 0 else 0)
  strict = not args.no_strict

  log.info(
    "Chợ Tốt crawl target=%d (no phones), pricing phones=%d, strict=%s",
    args.target,
    args.phones,
    strict,
  )

  all_products: list[dict] = []

  if args.target > 0:
    for cat in categories:
      if len(all_products) >= args.target:
        break
      remaining = args.target - len(all_products)
      fetch_count = min(per_cat, remaining) if per_cat else remaining
      log.info("▶ [%s] cg=%d → %s, fetch %d...", cat.label, cat.chotot_cg, cat.sub_category_id, fetch_count)
      ads = fetch_category(cat.chotot_cg, cat.label, fetch_count)

      added = 0
      for ad in ads:
        product = transform_ad(ad, cat)
        if product:
          all_products.append(product)
          added += 1

      log.info("  ✓ %d valid / %d ads, total: %d", added, len(ads), len(all_products))
      time.sleep(random.uniform(0.8, 1.5))

    before_dedupe = len(all_products)
    all_products = dedupe_products(all_products)
    log.info("Dedupe: %d → %d", before_dedupe, len(all_products))

    log.info("▶ Re-classify categories (strict=%s)...", strict)
    all_products, fix_stats = apply_category_fix(all_products, strict=strict)
    log_stats(fix_stats, all_products)

  if args.phones > 0:
    from import_phones_from_pricing import build_phone_products, load_phone_rows, merge_with_existing

    rows = load_phone_rows(Path(__file__).resolve().parent.parent / "pricing" / "data" / "phone_tablet_dataset.csv")
    phones = build_phone_products(rows, args.phones, shuffle=True)
    if args.merge_phones or args.target > 0:
      # Ghi tạm crawl rồi merge phones (loại sub-phone cũ nếu có)
      if all_products:
        args.output.write_text(json.dumps(all_products, ensure_ascii=False, indent=2), encoding="utf-8")
      all_products = merge_with_existing(args.output, phones)
    else:
      all_products = phones
    log.info("▶ Added %d phones from pricing (total %d)", len(phones), len(all_products))

  if not all_products:
    log.error("Không có sản phẩm — tăng --phones hoặc --target")
    return 0

  with open(args.output, "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

  log.info("✅ Saved %d products → %s", len(all_products), args.output)
  return len(all_products)


if __name__ == "__main__":
  count = main()
  print(f"\n🎉 Crawl complete: {count} products → {OUTPUT_FILE}")
