"""Map crawl / CSV fields → attribute value IDs (attributes-seed.yml)."""
from __future__ import annotations

import re
from typing import Optional

# Attribute IDs
ATTR_CONDITION = "attr-condition"
ATTR_COLOR = "attr-color"
ATTR_BRAND = "attr-brand"
ATTR_USAGE_TYPE = "attr-usage-type"
ATTR_ORIGIN = "attr-origin"
ATTR_WARRANTY = "attr-warranty"
ATTR_REGION = "attr-region"
ATTR_CAPACITY = "attr-capacity"

# Product variants must include all selected attributeIds
ALL_ATTRIBUTE_IDS = [
  ATTR_CONDITION,
  ATTR_COLOR,
  ATTR_BRAND,
  ATTR_USAGE_TYPE,
  ATTR_ORIGIN,
  ATTR_WARRANTY,
  ATTR_REGION,
  ATTR_CAPACITY,
]

USAGE_TYPE_MAP = {
  "BUY": "val-sell",
  "RENT": "val-rent",
  "BOTH": "val-both",
}

CONDITION_SL_MAP = {
  "new": "val-new",
  "like new": "val-like-new",
  "good": "val-good",
  "fair": "val-fair",
  "poor": "val-poor",
}

CONDITION_TEXT_MAP = {
  "mới": "val-new",
  "như mới": "val-like-new",
  "tốt": "val-good",
  "khá": "val-fair",
  "cũ": "val-fair",
  "hỏng": "val-poor",
  "new": "val-new",
  "like new": "val-like-new",
  "good": "val-good",
}

BRAND_ENUM_MAP = {
  "APPLE": "val-apple",
  "SAMSUNG": "val-samsung",
  "XIAOMI": "val-xiaomi",
  "OPPO": "val-oppo",
  "VIVO": "val-vivo",
  "HUAWEI": "val-huawei",
  "NOKIA": "val-nokia",
  "SONY": "val-sony",
  "ASUS": "val-asus",
  "DELL": "val-dell",
  "HP": "val-hp",
  "LENOVO": "val-lenovo",
  "ACER": "val-acer",
  "MSI": "val-msi",
  "CANON": "val-canon",
  "NIKON": "val-nikon",
  "FUJIFILM": "val-fujifilm",
  "PANASONIC": "val-panasonic",
  "LG": "val-lg",
  "IKEA": "val-ikea",
  "OTHER": "val-other",
}

BRAND_TEXT_MAP = {
  "ikea": "val-ikea",
  "sony": "val-sony",
  "samsung": "val-samsung",
  "galaxy": "val-samsung",
  "apple": "val-apple",
  "iphone": "val-apple",
  "macbook": "val-apple",
  "ipad": "val-apple",
  "xiaomi": "val-xiaomi",
  "redmi": "val-xiaomi",
  "oppo": "val-oppo",
  "vivo": "val-vivo",
  "huawei": "val-huawei",
  "dell": "val-dell",
  "hp": "val-hp",
  "lenovo": "val-lenovo",
  "thinkpad": "val-lenovo",
  "asus": "val-asus",
  "canon": "val-canon",
  "nikon": "val-nikon",
  "msi": "val-msi",
  "acer": "val-acer",
  "lg": "val-lg",
}

COLOR_TEXT_MAP = {
  "đỏ": "val-red",
  "red": "val-red",
  "xanh": "val-blue",
  "blue": "val-blue",
  "đen": "val-black",
  "black": "val-black",
  "trắng": "val-white",
  "white": "val-white",
  "vàng": "val-yellow",
  "yellow": "val-yellow",
  "xám": "val-gray",
  "gray": "val-gray",
  "grey": "val-gray",
  "hồng": "val-pink",
  "pink": "val-pink",
  "bạc": "val-silver",
  "silver": "val-silver",
  "vàng gold": "val-gold",
  "gold": "val-gold",
}

ORIGIN_LABEL_MAP = {
  "không rõ": "val-origin-unknown",
  "chính hãng": "val-origin-official",
  "chính hãng vn": "val-origin-official-vn",
  "nhập khẩu": "val-origin-imported",
  "xách tay": "val-origin-portable",
  "lắp ráp": "val-origin-assembled",
}

WARRANTY_LABEL_MAP = {
  "không bảo hành": "val-warranty-none",
  "còn bảo hành": "val-warranty-active",
  "hết bảo hành": "val-warranty-expired",
}

REGION_LABEL_MAP = {
  "tp hồ chí minh": "val-region-hcm",
  "tp. hồ chí minh": "val-region-hcm",
  "hồ chí minh": "val-region-hcm",
  "hà nội": "val-region-hn",
  "bình dương": "val-region-bd",
  "đà nẵng": "val-region-dn",
  "cần thơ": "val-region-ct",
  "hải phòng": "val-region-hp",
  "đồng nai": "val-region-dong-nai",
  "lâm đồng": "val-region-lam-dong",
  "đắk lắk": "val-region-dak-lak",
  "tiền giang": "val-region-tien-giang",
  "an giang": "val-region-an-giang",
  "thừa thiên huế": "val-region-hue",
  "huế": "val-region-hue",
  "bà rịa - vũng tàu": "val-region-br-vt",
  "đồng tháp": "val-region-dong-thap",
  "sóc trăng": "val-region-soc-trang",
}

CAPACITY_GB_MAP = {
  16: "val-cap-16gb",
  32: "val-cap-32gb",
  64: "val-cap-64gb",
  128: "val-cap-128gb",
  256: "val-cap-256gb",
  512: "val-cap-512gb",
  1024: "val-cap-1tb",
}


def _norm(s: str) -> str:
  return (s or "").strip().lower()


def detect_condition(text: str, sl_condition: str = "") -> str:
  if sl_condition:
    key = _norm(sl_condition)
    if key in CONDITION_SL_MAP:
      return CONDITION_SL_MAP[key]
  lower = _norm(text)
  for kw, val_id in CONDITION_TEXT_MAP.items():
    if kw in lower:
      return val_id
  return "val-good"


def detect_color(text: str) -> str:
  lower = _norm(text)
  for kw, val_id in COLOR_TEXT_MAP.items():
    if kw in lower:
      return val_id
  return "val-black"


def detect_brand(text: str, brand_enum: str = "") -> str:
  if brand_enum:
    key = brand_enum.strip().upper()
    if key in BRAND_ENUM_MAP:
      return BRAND_ENUM_MAP[key]
  lower = _norm(text)
  for kw, val_id in BRAND_TEXT_MAP.items():
    if kw in lower:
      return val_id
  return "val-other"


def detect_origin(origin_label: str) -> str:
  key = _norm(origin_label)
  return ORIGIN_LABEL_MAP.get(key, "val-origin-unknown")


def detect_warranty(warranty_label: str) -> str:
  key = _norm(warranty_label)
  return WARRANTY_LABEL_MAP.get(key, "val-warranty-none")


def detect_region(region_name: str) -> str:
  key = _norm(region_name)
  if key in REGION_LABEL_MAP:
    return REGION_LABEL_MAP[key]
  for label, val_id in REGION_LABEL_MAP.items():
    if label in key or key in label:
      return val_id
  return "val-region-hcm"


def detect_capacity(capacity: str) -> str:
  if not capacity or not str(capacity).strip():
    return "val-cap-na"
  match = re.search(r"(\d+)\s*(gb|tb)", str(capacity).lower())
  if not match:
    return "val-cap-na"
  num = int(match.group(1))
  unit = match.group(2)
  if unit == "tb":
    num *= 1024
  return CAPACITY_GB_MAP.get(num, "val-cap-na")


def parse_manufacture_year(raw: str | int | None) -> Optional[int]:
  if raw is None or raw == "":
    return None
  try:
    year = int(str(raw).strip())
  except ValueError:
    match = re.search(r"(20[0-3]\d)", str(raw))
    year = int(match.group(1)) if match else None
  if year is None or year < 1990 or year > 2100:
    return None
  return year


def build_variant(raw: dict, listing_type: str) -> dict:
  """Build ProductVariantCreateRequest with full pricing-related attributes."""
  text = f"{raw.get('name', '')} {raw.get('description', '')}"
  usage_val = USAGE_TYPE_MAP.get(listing_type, "val-sell")
  return {
    "attributeValueIds": [
      raw.get("condition_val_id") or detect_condition(text, raw.get("sl_condition", "")),
      raw.get("color_val_id") or detect_color(text),
      raw.get("brand_val_id") or detect_brand(text, raw.get("brand", "")),
      usage_val,
      raw.get("origin_val_id") or detect_origin(raw.get("origin_label", "")),
      raw.get("warranty_val_id") or detect_warranty(raw.get("warranty_label", "")),
      raw.get("region_val_id") or detect_region(raw.get("region_name", "")),
      raw.get("capacity_val_id") or detect_capacity(raw.get("capacity", "")),
    ]
  }
