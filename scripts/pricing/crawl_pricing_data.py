#!/usr/bin/env python3
"""
Crawl price data from Chợ Tốt and save CSV for Second Life pricing model training.

Default output: pricing/data/pricing_dataset.csv

Examples (run from pricing/):
  python3 crawl_pricing_data.py
  python3 crawl_pricing_data.py --target 10000 --fetch-details
  python3 crawl_pricing_data.py --output data/phones.csv --categories 5010,5040
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import random
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import requests

from category_remap import resolve_mapping_from_ad
from chotot_config import (
  CATEGORIES,
  CATEGORY_BY_CG,
  CHOTOT_API_DETAIL,
  CHOTOT_API_LIST,
  CONDITION_LABELS,
  CSV_COLUMNS,
  HEADERS,
  ORIGIN_LABELS,
  WARRANTY_LABELS,
  CategoryMapping,
)
from field_inference import (
  infer_brand_from_text,
  infer_capacity_label,
  infer_color,
  infer_manufacture_year,
  infer_origin_label,
  infer_sl_condition,
  infer_warranty_label,
)

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent
DEFAULT_OUTPUT = SCRIPT_DIR / "data" / "pricing_dataset.csv"
CHECKPOINT_FILE = SCRIPT_DIR / "data" / ".crawl_checkpoint.json"

PAGE_SIZE = 50
DEFAULT_TARGET = 5000
DEFAULT_DELAY = (0.8, 1.5)
def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Crawl Chợ Tốt → CSV for pricing model training")
  parser.add_argument(
    "--target",
    type=int,
    default=DEFAULT_TARGET,
    help=f"Target number of listings (default {DEFAULT_TARGET})",
  )
  parser.add_argument(
    "--output",
    type=Path,
    default=DEFAULT_OUTPUT,
    help="Output CSV file path",
  )
  parser.add_argument(
    "--categories",
    type=str,
    default="",
    help="Comma-separated Chợ Tốt cg codes (default: all)",
  )
  parser.add_argument(
    "--fetch-details",
    action="store_true",
    help="Fetch detail API for brand/model/params (slower, richer features)",
  )
  parser.add_argument(
    "--delay-min",
    type=float,
    default=DEFAULT_DELAY[0],
    help="Minimum delay between requests (seconds)",
  )
  parser.add_argument(
    "--delay-max",
    type=float,
    default=DEFAULT_DELAY[1],
    help="Maximum delay between requests (seconds)",
  )
  parser.add_argument(
    "--resume",
    action="store_true",
    help="Skip already-crawled list_ids (reads checkpoint + existing CSV)",
  )
  return parser.parse_args()


def sleep_between(delay_min: float, delay_max: float) -> None:
  time.sleep(random.uniform(delay_min, delay_max))


def load_seen_ids(output: Path, resume: bool) -> set[str]:
  seen: set[str] = set()
  if resume and output.exists():
    with output.open(newline="", encoding="utf-8") as f:
      reader = csv.DictReader(f)
      for row in reader:
        lid = row.get("source_list_id")
        if lid:
          seen.add(lid)
    log.info("Resume: skipping %d list_ids already in CSV", len(seen))
  if resume and CHECKPOINT_FILE.exists():
    try:
      data = json.loads(CHECKPOINT_FILE.read_text(encoding="utf-8"))
      seen.update(str(x) for x in data.get("seen_ids", []))
    except (json.JSONDecodeError, OSError):
      pass
  return seen


def save_checkpoint(seen_ids: set[str], stats: dict[str, Any]) -> None:
  CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
  payload = {
    "seen_ids": list(seen_ids),
    "stats": stats,
    "updated_at": datetime.now(timezone.utc).isoformat(),
  }
  CHECKPOINT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_page(
  session: requests.Session,
  cg: int,
  page: int,
  delay_min: float,
  delay_max: float,
) -> list[dict[str, Any]]:
  offset = (page - 1) * PAGE_SIZE
  params = {"cg": cg, "limit": PAGE_SIZE, "o": offset}
  resp = session.get(CHOTOT_API_LIST, params=params, headers=HEADERS, timeout=30)
  resp.raise_for_status()
  sleep_between(delay_min, delay_max)
  data = resp.json()
  return data.get("ads") or []


def fetch_detail(
  session: requests.Session,
  list_id: int,
  delay_min: float,
  delay_max: float,
) -> Optional[dict[str, Any]]:
  url = CHOTOT_API_DETAIL.format(list_id=list_id)
  try:
    resp = session.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    sleep_between(delay_min, delay_max)
    return resp.json().get("ad")
  except requests.RequestException as exc:
    log.warning("Detail fetch failed list_id=%s: %s", list_id, exc)
    return None


def params_to_dict(params: Optional[list[dict[str, Any]]]) -> dict[str, str]:
  result: dict[str, str] = {}
  if not params:
    return result
  for p in params:
    label = (p.get("label") or p.get("id") or "").strip()
    value = str(p.get("value") or "").strip()
    if label and value:
      result[label] = value
  return result


def extract_brand_model(
  ad: dict[str, Any],
  param_map: dict[str, str],
  subcat_id: str,
) -> tuple[str, str, str, str, str]:
  """Extract brand, model, capacity, color, and manufacture year from params or numeric fields."""
  brand = (
    param_map.get("Hãng")
    or param_map.get("Thương hiệu")
    or param_map.get("Hãng xe")
    or ""
  )
  model = (
    param_map.get("Dòng máy")
    or param_map.get("Dòng")
    or param_map.get("Model")
    or param_map.get("Dòng xe")
    or ""
  )
  capacity = (
    param_map.get("Dung lượng")
    or param_map.get("Bộ nhớ")
    or param_map.get("Dung tích")
    or ""
  )
  color = param_map.get("Màu sắc") or param_map.get("Màu") or ""
  year = param_map.get("Năm sản xuất") or param_map.get("Đời") or param_map.get("Năm") or ""

  # Fallback: use title when brand/model missing (NLP text feature)
  if not brand and not model:
    subject = ad.get("subject") or ""
    if subject:
      model = subject

  combined_text = f"{ad.get('subject', '')} {ad.get('body', '')}".strip()
  if not brand:
    brand = infer_brand_from_text(combined_text)
  if not capacity:
    capacity = infer_capacity_label(combined_text, subcat_id)
  if not color:
    color = infer_color(combined_text)
  if not year:
    year = infer_manufacture_year(combined_text, subcat_id)

  return brand, model, capacity, color, year


def listing_type_from_ad(ad: dict[str, Any]) -> str:
  ad_type = (ad.get("type") or "s").lower()
  if ad_type in ("u", "rent", "r"):
    return "RENT"
  return "BUY"


def normalize_ad(
  ad: dict[str, Any],
  mapping: CategoryMapping,
  detail: Optional[dict[str, Any]],
  crawled_at: str,
) -> Optional[dict[str, str]]:
  price = ad.get("price")
  if price is None or price <= 0:
    return None

  merged = {**ad}
  if detail:
    merged.update({k: v for k, v in detail.items() if v is not None})

  param_map = params_to_dict(merged.get("params"))
  mapping = resolve_mapping_from_ad(merged, mapping)
  brand, model, capacity, color, year = extract_brand_model(
    merged, param_map, mapping.sl_sub_category_id,
  )

  # Remove flattened params from extra JSON
  used_labels = {"Hãng", "Thương hiệu", "Hãng xe", "Dòng máy", "Dòng", "Model", "Dòng xe",
         "Dung lượng", "Bộ nhớ", "Dung tích", "Màu sắc", "Màu",
         "Năm sản xuất", "Đời", "Năm"}
  extra = {k: v for k, v in param_map.items() if k not in used_labels}

  condition_code = merged.get("elt_condition")
  origin_code = merged.get("elt_origin")
  warranty_code = merged.get("elt_warranty")

  images = merged.get("images") or []
  if not images and merged.get("image"):
    images = [merged["image"]]

  list_id = merged.get("list_id")
  if not list_id:
    return None

  merged_text = f"{merged.get('subject', '')} {merged.get('body', '')}".strip()
  inferred_condition = infer_sl_condition(merged_text, str(condition_code or ""))

  row = {
    "source": "chotot",
    "source_list_id": str(list_id),
    "source_ad_id": str(merged.get("ad_id") or ""),
    "title": (merged.get("subject") or "").strip(),
    "description": (merged.get("body") or "").replace("\n", " ").strip(),
    "price_vnd": str(int(price)),
    "price_string": merged.get("price_string") or "",
    "listing_type": listing_type_from_ad(merged),
    "chotot_category_id": str(merged.get("category") or mapping.chotot_cg),
    "chotot_category_name": merged.get("category_name") or mapping.chotot_name,
    "sl_category_id": mapping.sl_category_id,
    "sl_category_name": mapping.sl_category_name,
    "sl_sub_category_id": mapping.sl_sub_category_id,
    "sl_sub_category_name": mapping.sl_sub_category_name,
    "condition_code": str(condition_code) if condition_code is not None else "",
    "condition_label": CONDITION_LABELS.get(condition_code, ""),
    "sl_condition": inferred_condition,
    "origin_code": str(origin_code) if origin_code is not None else "",
    "origin_label": infer_origin_label(
      merged_text, str(origin_code or ""), ORIGIN_LABELS.get(origin_code, ""),
    ),
    "warranty_code": str(warranty_code) if warranty_code is not None else "",
    "warranty_label": infer_warranty_label(
      merged_text, str(warranty_code or ""), WARRANTY_LABELS.get(warranty_code, ""),
    ),
    "brand": brand,
    "model": model,
    "capacity": capacity,
    "color": color,
    "manufacture_year": year,
    "extra_attributes_json": json.dumps(extra, ensure_ascii=False) if extra else "",
    "region_name": merged.get("region_name") or merged.get("region_name_v3") or "",
    "area_name": merged.get("area_name") or "",
    "ward_name": merged.get("ward_name") or merged.get("ward_name_v3") or "",
    "latitude": str(merged.get("latitude") or ""),
    "longitude": str(merged.get("longitude") or ""),
    "num_images": str(merged.get("number_of_images") or len(images)),
    "has_video": "1" if (merged.get("contain_videos") or 0) > 0 else "0",
    "posted_at_ms": str(merged.get("list_time") or ""),
    "thumbnail_url": merged.get("thumbnail_image") or merged.get("image") or "",
    "image_urls": "|".join(images[:10]),
    "crawled_at": crawled_at,
  }
  return row


def resolve_categories(categories_arg: str) -> list[CategoryMapping]:
  if not categories_arg.strip():
    return CATEGORIES
  codes = [int(c.strip()) for c in categories_arg.split(",") if c.strip()]
  result = []
  for code in codes:
    mapping = CATEGORY_BY_CG.get(code)
    if mapping:
      result.append(mapping)
    else:
      log.warning("No mapping for cg=%d, skipping", code)
  return result


def open_csv_writer(output: Path, resume: bool) -> tuple[Any, bool]:
  output.parent.mkdir(parents=True, exist_ok=True)
  write_header = not (resume and output.exists() and output.stat().st_size > 0)
  mode = "a" if resume and output.exists() else "w"
  f = output.open(mode, newline="", encoding="utf-8")
  writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
  if write_header:
    writer.writeheader()
  return (writer, f), write_header


def crawl(args: argparse.Namespace) -> int:
  categories = resolve_categories(args.categories)
  if not categories:
    log.error("No valid categories to crawl")
    return 1

  seen_ids = load_seen_ids(args.output, args.resume)
  crawled_at = datetime.now(timezone.utc).isoformat()
  session = requests.Session()

  (writer, csv_file), _ = open_csv_writer(args.output, args.resume)
  collected = 0
  stats: dict[str, int] = {"pages": 0, "skipped_dup": 0, "skipped_no_price": 0, "errors": 0}

  try:
    per_category_target = max(1, args.target // len(categories))
    log.info(
      "Starting crawl: target=%d, categories=%d (~%d/category), fetch_details=%s",
      args.target,
      len(categories),
      per_category_target,
      args.fetch_details,
    )

    for mapping in categories:
      if collected >= args.target:
        break

      category_count = 0
      page = 1
      empty_streak = 0
      duplicate_page_streak = 0

      log.info("Category cg=%d (%s) → %s", mapping.chotot_cg, mapping.chotot_name, mapping.sl_sub_category_name)

      while category_count < per_category_target and collected < args.target:
        try:
          ads = fetch_page(
            session,
            mapping.chotot_cg,
            page,
            args.delay_min,
            args.delay_max,
          )
        except requests.RequestException as exc:
          log.error("Failed to fetch page cg=%d page=%d: %s", mapping.chotot_cg, page, exc)
          stats["errors"] += 1
          page += 1
          empty_streak += 1
          if empty_streak >= 3:
            break
          continue

        stats["pages"] += 1
        if not ads:
          empty_streak += 1
          if empty_streak >= 2:
            log.info("  No more data for cg=%d at page=%d", mapping.chotot_cg, page)
            break
          page += 1
          continue

        empty_streak = 0
        added_in_page = 0

        for ad in ads:
          if collected >= args.target or category_count >= per_category_target:
            break

          list_id = ad.get("list_id")
          if not list_id:
            continue
          list_id_str = str(list_id)
          if list_id_str in seen_ids:
            stats["skipped_dup"] += 1
            continue

          detail = None
          if args.fetch_details:
            detail = fetch_detail(session, list_id, args.delay_min, args.delay_max)

          row = normalize_ad(ad, mapping, detail, crawled_at)
          if row is None:
            stats["skipped_no_price"] += 1
            continue

          writer.writerow(row)
          seen_ids.add(list_id_str)
          collected += 1
          category_count += 1
          added_in_page += 1

          if collected % 100 == 0:
            csv_file.flush()
            save_checkpoint(seen_ids, {**stats, "collected": collected})
            log.info("  Progress: %d/%d listings", collected, args.target)

        page += 1
        if added_in_page == 0:
          duplicate_page_streak += 1
        else:
          duplicate_page_streak = 0

        if duplicate_page_streak >= 20:
          log.info(
            "  Stopping cg=%d after %d duplicate-only pages (likely exhausted or looping)",
            mapping.chotot_cg,
            duplicate_page_streak,
          )
          break

      log.info("  Done cg=%d: +%d listings (total %d)", mapping.chotot_cg, category_count, collected)

    csv_file.flush()
    save_checkpoint(seen_ids, {**stats, "collected": collected})

  finally:
    csv_file.close()

  log.info(
    "Finished: %d listings → %s (pages=%d, dup=%d, no_price=%d, errors=%d)",
    collected,
    args.output,
    stats["pages"],
    stats["skipped_dup"],
    stats["skipped_no_price"],
    stats["errors"],
  )
  return 0 if collected > 0 else 1


def main() -> None:
  args = parse_args()
  sys.exit(crawl(args))


if __name__ == "__main__":
  main()
