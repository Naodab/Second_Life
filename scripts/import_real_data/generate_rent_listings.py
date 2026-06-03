#!/usr/bin/env python3
"""
Generate additional RENT listings from existing Tiki data in raw_products.json.

Logic:
 - Filter products in categories suitable for rental
  (cameras, bikes, sports gear, camping, toys, large appliances...)
 - Clone them as listing_type=RENT with rent price derived from buy price
 - Append to raw_products.json

Run: python3 generate_rent_listings.py
"""
from __future__ import annotations

import json
import random
import logging
from pathlib import Path
from collections import Counter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

DATA_FILE = Path(__file__).parent / "data" / "raw_products.json"

# Per-category config: rental ratio and price calculation
# ──────────────────────────────────────────────────────────────────────────────
# Structure: sub_cat_id → (rent_ratio, rent_unit, price_divisor)
#   rent_ratio   : share of products in category cloned as RENT
#   rent_unit    : DAY / MONTH / HOUR
#   price_divisor: rent price = buy price / divisor (rounded to 1000 VND)
#   min_rent     : minimum rent price (VND)

RENT_CONFIG: dict[str, dict] = {
  # Cameras – daily rental is common
  "sub-camera":           {"ratio": 0.8, "unit": "DAY",   "divisor": 30,  "min": 100_000},
  # Bikes – daily / hourly rental
  "sub-bike":             {"ratio": 0.9, "unit": "DAY",   "divisor": 20,  "min": 50_000},
  # Camping gear – per-trip (daily) rental
  "sub-camping":          {"ratio": 0.9, "unit": "DAY",   "divisor": 15,  "min": 30_000},
  # Sports equipment – daily rental
  "sub-fitness":          {"ratio": 0.5, "unit": "DAY",   "divisor": 25,  "min": 30_000},
  # Kids toys – monthly rental
  "sub-toys":             {"ratio": 0.6, "unit": "MONTH", "divisor": 5,   "min": 50_000},
  # Large appliances (washer, fridge...) – monthly rental
  "sub-home-appliance":   {"ratio": 0.3, "unit": "MONTH", "divisor": 8,   "min": 200_000},
  # Furniture – monthly rental (students, renters)
  "sub-furniture-living": {"ratio": 0.5, "unit": "MONTH", "divisor": 6,   "min": 100_000},
  # Kitchen items (blender, juicer...) – daily / monthly rental
  "sub-kitchen":          {"ratio": 0.2, "unit": "DAY",   "divisor": 20,  "min": 30_000},
  # Laptops – daily rental (events, conferences)
  "sub-laptop":           {"ratio": 0.25,"unit": "DAY",   "divisor": 40,  "min": 150_000},
  # TVs – monthly rental
  "sub-tv":               {"ratio": 0.2, "unit": "MONTH", "divisor": 6,   "min": 200_000},
  # Baby items – monthly rental (high chair, stroller...)
  "sub-baby-stuff":       {"ratio": 0.35,"unit": "MONTH", "divisor": 5,   "min": 100_000},
  # Kids games – monthly rental
  "sub-games":            {"ratio": 0.5, "unit": "MONTH", "divisor": 5,   "min": 100_000},
  # Special fashion – ao dai, swimwear... daily rental
  "sub-women-clothing":   {"ratio": 0.1, "unit": "DAY",   "divisor": 8,   "min": 50_000},
  "sub-men-clothing":     {"ratio": 0.1, "unit": "DAY",   "divisor": 8,   "min": 50_000},
}

# Description templates appended to clarify rental listings (Vietnamese user-facing text)
RENT_DESC_TEMPLATES = [
  "🏷️ CHO THUÊ – {original_desc}\n\n"
  "✅ Sản phẩm còn rất tốt, đầy đủ phụ kiện. Giá thuê tính theo {unit_vn}.\n"
  "📞 Liên hệ để đặt lịch thuê trước.",

  "📦 CHO THUÊ – {original_desc}\n\n"
  "• Tình trạng: còn tốt, đã qua sử dụng\n"
  "• Đơn vị thuê: {unit_vn}\n"
  "• Đặt cọc theo thỏa thuận.\n"
  "• Giao nhận tại cơ sở hoặc ship.",

  "🔄 CHO THUÊ NGẮN / DÀI HẠN – {original_desc}\n\n"
  "Phù hợp cho nhu cầu {unit_vn_use}. Bảo trì, vệ sinh sạch sẽ trước mỗi lần thuê.",
]

UNIT_VI = {
  "DAY":   "ngày",
  "MONTH": "tháng",
  "HOUR":  "giờ",
}
UNIT_VI_USE = {
  "DAY":   "ngắn hạn theo ngày",
  "MONTH": "dài hạn theo tháng",
  "HOUR":  "theo giờ",
}


def rent_price(buy_price: int, divisor: int, min_price: int) -> int:
  """Compute rent price from buy price, rounded to 1000 VND."""
  price = int(buy_price / divisor / 1000) * 1000
  return max(price, min_price)


def make_rent_description(original_desc: str, unit: str) -> str:
  tpl = random.choice(RENT_DESC_TEMPLATES)
  return tpl.format(
    original_desc=original_desc[:500],
    unit_vn=UNIT_VI[unit],
    unit_vn_use=UNIT_VI_USE[unit],
  )[:8000]


def generate_rent_products(products: list[dict]) -> list[dict]:
  """Generate RENT clones from BUY products per RENT_CONFIG."""
  rent_products: list[dict] = []

  by_cat: dict[str, list[dict]] = {}
  for p in products:
    cat = p.get("primarySubCategoryId", "")
    if cat not in by_cat:
      by_cat[cat] = []
    by_cat[cat].append(p)

  for sub_cat, cfg in RENT_CONFIG.items():
    pool = [p for p in by_cat.get(sub_cat, []) if p.get("listing_type") == "BUY"]
    if not pool:
      log.warning("  [%s] No BUY products to clone", sub_cat)
      continue

    # Random sample by ratio
    n = max(1, int(len(pool) * cfg["ratio"]))
    selected = random.sample(pool, min(n, len(pool)))

    for orig in selected:
      buy_price = orig.get("price") or 200_000
      r_price   = rent_price(buy_price, cfg["divisor"], cfg["min"])
      unit      = cfg["unit"]

      clone = {
        **orig,
        "listing_type": "RENT",
        "price":        r_price,
        "description":  make_rent_description(orig.get("description", orig.get("name", "")), unit),
        "rent_unit":    unit,
        "_source":      {**orig.get("_source", {}), "generated_rent": True},
      }
      rent_products.append(clone)

    log.info("  [%s] %d BUY → %d RENT clones", sub_cat, len(pool), len(selected))

  return rent_products


def main():
  with open(DATA_FILE, encoding="utf-8") as f:
    products: list[dict] = json.load(f)

  buy_count  = sum(1 for p in products if p.get("listing_type") == "BUY")
  rent_count = sum(1 for p in products if p.get("listing_type") == "RENT")
  log.info("Current: %d BUY + %d RENT = %d total", buy_count, rent_count, len(products))

  log.info("Generating RENT listings...")
  new_rent = generate_rent_products(products)
  log.info("Generated %d new RENT listings", len(new_rent))

  # Append to list
  all_products = products + new_rent

  new_buy   = sum(1 for p in all_products if p.get("listing_type") == "BUY")
  new_rent_t = sum(1 for p in all_products if p.get("listing_type") == "RENT")
  log.info("After append: %d BUY + %d RENT = %d total", new_buy, new_rent_t, len(all_products))

  # RENT distribution by category
  rent_by_cat = Counter(
    p["primarySubCategoryId"]
    for p in all_products
    if p.get("listing_type") == "RENT"
  )
  log.info("\n=== RENT distribution ===")
  for cat, cnt in sorted(rent_by_cat.items(), key=lambda x: -x[1]):
    log.info("  %-35s: %d", cat, cnt)

  with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

  log.info("\n✅ Saved %d products (BUY + RENT) → %s", len(all_products), DATA_FILE)
  return len(new_rent)


if __name__ == "__main__":
  count = main()
  print(f"\n🎉 Added {count} RENT listings to raw_products.json")
