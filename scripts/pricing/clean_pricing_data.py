#!/usr/bin/env python3
"""Clean pricing_dataset.csv for XGBoost training."""

from __future__ import annotations

import argparse
import csv
import json
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from category_remap import remap_row_categories
from chotot_config import CSV_COLUMNS, DEFAULT_BRAND_ENUM
from field_inference import ELECTRONICS_SUBCATS, enrich_row

SCRIPT_DIR = Path(__file__).parent
DEFAULT_INPUT = SCRIPT_DIR / "data" / "pricing_dataset.csv"
DEFAULT_OUTPUT = SCRIPT_DIR / "data" / "pricing_dataset.csv"
DEFAULT_REPORT = SCRIPT_DIR / "data" / "pricing_clean_report.json"


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Clean pricing dataset CSV")
  parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
  parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
  parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
  parser.add_argument("--backup", action="store_true", help="Backup input to pricing_dataset_raw.csv")
  parser.add_argument("--min-price", type=int, default=10_000, help="Drop rows below this price")
  parser.add_argument("--no-outlier-filter", action="store_true")
  return parser.parse_args()


def _filled(row: dict[str, str], field: str) -> bool:
  value = (row.get(field) or "").strip()
  if field in ("origin_label",):
    return value not in ("", "Không rõ")
  if field in ("warranty_label",):
    return value not in ("", "Không bảo hành")
  if field == "brand":
    return value not in ("", DEFAULT_BRAND_ENUM)
  return value not in ("", "0", "Unknown")


def clean_rows(rows: list[dict[str, str]], min_price: int, filter_outliers: bool) -> tuple[list[dict[str, str]], dict]:
  stats: dict = {
    "input_rows": len(rows),
    "removed_invalid_price": 0,
    "removed_short_title": 0,
    "removed_outliers": 0,
    "remapped_from_cg": 0,
    "laptop_from_tablet": 0,
    "car_from_moto": 0,
    "remapped_heuristic": 0,
    "brand_inferred_from_text": 0,
  }

  cleaned: list[dict[str, str]] = []
  for row in rows:
    title = (row.get("title") or "").strip()
    if len(title) < 3:
      stats["removed_short_title"] += 1
      continue

    try:
      price = float(row.get("price_vnd") or 0)
    except ValueError:
      stats["removed_invalid_price"] += 1
      continue
    if price < min_price:
      stats["removed_invalid_price"] += 1
      continue

    row, remap_stats = remap_row_categories(dict(row))
    for key, count in remap_stats.items():
      stats[key] = stats.get(key, 0) + count

    row, field_stats = enrich_row(row)
    for key, count in field_stats.items():
      stats[key] = stats.get(key, 0) + count

    cleaned.append(row)

  if filter_outliers:
    before = len(cleaned)
    parts: list[dict[str, str]] = []
    by_cat: dict[str, list[dict[str, str]]] = {}
    for row in cleaned:
      by_cat.setdefault(row.get("sl_category_name", "Unknown"), []).append(row)

    for _, grp in by_cat.items():
      prices = sorted(float(r["price_vnd"]) for r in grp)
      if len(prices) < 20:
        parts.extend(grp)
        continue
      q_low = prices[int(len(prices) * 0.01)]
      q_high = prices[int(len(prices) * 0.99)]
      parts.extend(r for r in grp if q_low <= float(r["price_vnd"]) <= q_high)

    cleaned = parts
    stats["removed_outliers"] = before - len(cleaned)

  stats["output_rows"] = len(cleaned)
  stats["brand_distribution"] = dict(Counter(r["brand"] for r in cleaned).most_common(20))
  stats["condition_distribution"] = dict(Counter(r["sl_condition"] for r in cleaned))
  stats["origin_distribution"] = dict(Counter(r["origin_label"] for r in cleaned).most_common(8))
  stats["warranty_distribution"] = dict(Counter(r["warranty_label"] for r in cleaned).most_common(5))

  n = len(cleaned) or 1
  stats["fill_rates"] = {
    field: round(100 * sum(1 for r in cleaned if _filled(r, field)) / n, 1)
    for field in (
      "brand",
      "model",
      "capacity",
      "color",
      "manufacture_year",
      "origin_label",
      "warranty_label",
    )
  }
  elec = [r for r in cleaned if r.get("sl_sub_category_id") in ELECTRONICS_SUBCATS]
  if elec:
    stats["electronics_capacity_fill_pct"] = round(
      100 * sum(1 for r in elec if _filled(r, "capacity")) / len(elec),
      1,
    )
  return cleaned, stats


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  with path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)


def main() -> None:
  args = parse_args()
  rows = list(csv.DictReader(args.input.open(encoding="utf-8")))
  if args.backup and args.input.exists():
    backup = args.input.with_name("pricing_dataset_raw.csv")
    shutil.copy2(args.input, backup)

  cleaned, stats = clean_rows(rows, args.min_price, filter_outliers=not args.no_outlier_filter)
  stats["cleaned_at"] = datetime.now(timezone.utc).isoformat()
  stats["input_file"] = str(args.input)
  stats["output_file"] = str(args.output)

  write_csv(args.output, cleaned)
  args.report.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")

  print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
  main()
