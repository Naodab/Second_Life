"""Infer/normalize pricing CSV fields from title, description, and API codes."""

from __future__ import annotations

import json
import re
from typing import Any

from chotot_config import (
  BRAND_ENUM_KEYWORDS,
  DEFAULT_BRAND_ENUM,
  ORIGIN_LABELS,
  SL_CONDITION_MAP,
  WARRANTY_LABELS,
  infer_brand_from_text,
)

CURRENT_YEAR = 2026
ELECTRONICS_SUBCATS = {
  "sub-phone",
  "sub-tablet",
  "sub-laptop",
  "sub-tv",
  "sub-camera",
  "sub-home-appliance",
}
VEHICLE_SUBCATS = {"sub-motorcycle", "sub-car", "sub-bike", "sub-auto-part"}

BRAND_ALIASES = {"Khác": "OTHER", "khac": "OTHER", "Other": "OTHER", "other": "OTHER"}
KNOWN_BRAND_ENUMS = set(BRAND_ENUM_KEYWORDS.keys())

DEFAULT_ORIGIN = "Không rõ"
DEFAULT_WARRANTY = "Không bảo hành"

TEXT_CONDITION_KEYWORDS: dict[str, tuple[str, ...]] = {
  "New": ("mới 100", "new 100", "brand new", "nguyên seal", "mới keng", "mới tinh", "chưa qua sử dụng"),
  "Like New": ("như mới", "99%", "98%", "97%", "like new", "lướt", "ít dùng", "máy đẹp"),
  "Good": ("đã sử dụng", "còn tốt", "xước nhẹ", "trầy nhẹ"),
}

ORIGIN_TEXT_KEYWORDS: dict[str, tuple[str, ...]] = {
  "Chính hãng VN": ("chính hãng vn", "hàng vn", "vietnam"),
  "Chính hãng": ("chính hãng", "chinh hang", "authorized"),
  "Nhập khẩu": ("nhập khẩu", "nhap khau", "import", "ship mỹ", "nhập thái"),
  "Xách tay": ("xách tay", "xach tay"),
  "Lắp ráp": ("lắp ráp", "lap rap"),
}

WARRANTY_TEXT_KEYWORDS: dict[str, tuple[str, ...]] = {
  "Còn bảo hành": (
    "còn bảo hành", "con bao hanh", "còn bh", "bao hanh den",
    "bảo hành đến", "còn warranty", "bh chính hãng", "bảo hành 12",
    "bảo hành 6 tháng",
  ),
  "Hết bảo hành": ("hết bảo hành", "het bao hanh", "hết bh"),
}

COLOR_KEYWORDS: tuple[tuple[str, str], ...] = (
  ("đen", "đen"),
  ("trắng", "trắng"),
  ("xanh dương", "xanh dương"),
  ("xanh lá", "xanh lá"),
  ("xanh", "xanh"),
  ("đỏ", "đỏ"),
  ("vàng", "vàng"),
  ("hồng", "hồng"),
  ("tím", "tím"),
  ("nâu", "nâu"),
  ("cam", "cam"),
  ("xám", "xám"),
  ("bạc", "bạc"),
  ("black", "đen"),
  ("white", "trắng"),
  ("blue", "xanh dương"),
  ("red", "đỏ"),
  ("gold", "vàng"),
  ("silver", "bạc"),
  ("pink", "hồng"),
  ("purple", "tím"),
  ("grey", "xám"),
  ("gray", "xám"),
)

_CAPACITY_PATTERNS = [
  re.compile(r"\b(\d{1,4})\s*/\s*(\d{1,4})\s*(gb|tb)\b", re.I),
  re.compile(r"\bram\s*(\d{1,4})\s*(gb|tb)\b", re.I),
  re.compile(r"\b(\d{1,4})\s*(gb|tb)\b", re.I),
  re.compile(r"\b(\d{1,4})\s*g\b", re.I),
]

_YEAR_PATTERNS = [
  re.compile(r"\b(?:sx|sản xuất|đời|model|năm)\s*[:.]?\s*(20[0-3]\d|19\d{2})\b", re.I),
  re.compile(r"\b(20[0-3]\d|19[0-9]\d)\b"),
]


def _merge_text(title: str, description: str) -> str:
  return f"{title} {description}".strip()


def normalize_brand(raw: str, title: str, description: str) -> str:
  value = (raw or "").strip()
  if value in BRAND_ALIASES:
    value = BRAND_ALIASES[value]
  upper = value.upper()
  if upper in KNOWN_BRAND_ENUMS and upper != DEFAULT_BRAND_ENUM:
    return upper
  inferred = infer_brand_from_text(_merge_text(title, description))
  if inferred != DEFAULT_BRAND_ENUM:
    return inferred
  if value and value not in {"", DEFAULT_BRAND_ENUM, "Khác"}:
    compact = re.sub(r"\s+", " ", value).strip().upper()
    if compact:
      return compact
  return DEFAULT_BRAND_ENUM


def infer_capacity_label(text: str, subcat: str, existing: str = "") -> str:
  if subcat not in ELECTRONICS_SUBCATS:
    return (existing or "").strip()

  raw = (existing or "").strip()
  if raw and re.search(r"\d", raw):
    return _normalize_capacity_label(raw)

  lower = text.lower()
  slash = _CAPACITY_PATTERNS[0].search(lower)
  if slash:
    storage = int(slash.group(2))
    unit = slash.group(3).lower()
    if unit == "tb":
      storage *= 1024
    return f"{storage}GB"

  ram = _CAPACITY_PATTERNS[1].search(lower)
  if ram:
    n = int(ram.group(1))
    unit = ram.group(2).lower()
    if unit == "tb":
      n *= 1024
    return f"{n}GB"

  matches = list(_CAPACITY_PATTERNS[2].finditer(lower))
  if matches:
    best = max(matches, key=lambda m: int(m.group(1)))
    n = int(best.group(1))
    unit = best.group(2).lower()
    if unit == "tb":
      n *= 1024
    if n >= 16 or subcat in {"sub-phone", "sub-tablet", "sub-laptop"}:
      return f"{n}GB"

  return _normalize_capacity_label(raw) if raw else ""


def _normalize_capacity_label(raw: str) -> str:
  raw = raw.strip()
  if not raw:
    return ""
  if re.fullmatch(r"\d+", raw):
    return f"{raw}GB"
  m = re.search(r"(\d+)\s*(gb|tb)", raw, re.I)
  if m:
    n = int(m.group(1))
    if m.group(2).lower() == "tb":
      n *= 1024
    return f"{n}GB"
  return raw


def infer_color(text: str, existing: str = "") -> str:
  value = (existing or "").strip()
  if value:
    return value
  lower = text.lower()
  for needle, label in COLOR_KEYWORDS:
    if needle in lower:
      return label
  return ""


def infer_manufacture_year(
  text: str,
  subcat: str,
  existing: str = "",
  posted_at_ms: str = "",
) -> str:
  if (existing or "").strip():
    y = _valid_year(existing.strip())
    if y:
      return y

  lower = text.lower()
  candidates: list[int] = []

  for pattern in _YEAR_PATTERNS:
    for match in pattern.finditer(lower):
      y = int(match.group(1))
      if 1990 <= y <= CURRENT_YEAR:
        candidates.append(y)

  if not candidates:
    return ""

  if subcat in VEHICLE_SUBCATS or subcat in ELECTRONICS_SUBCATS:
    return str(max(candidates))

  return str(candidates[0])


def _valid_year(raw: str) -> str:
  try:
    y = int(raw)
  except ValueError:
    return ""
  if 1990 <= y <= CURRENT_YEAR:
    return str(y)
  return ""


def infer_sl_condition(
  text: str,
  condition_code: str = "",
  existing: str = "",
) -> str:
  value = (existing or "").strip()
  if value in {"New", "Like New", "Good", "Fair", "Poor"}:
    pass
  else:
    value = ""

  try:
    code = int(condition_code) if condition_code not in ("", None) else None
  except (TypeError, ValueError):
    code = None
  from_code = SL_CONDITION_MAP.get(code, "") if code is not None else ""

  lower = text.lower()
  for label, keys in TEXT_CONDITION_KEYWORDS.items():
    if any(k in lower for k in keys):
      text_hit = label
      break
  else:
    text_hit = ""

  if text_hit == "New":
    return "New"
  if text_hit == "Like New":
    return "Like New"
  if from_code == "New":
    return "New"
  if from_code == "Like New" or text_hit:
    return text_hit or from_code or "Good"
  return from_code or value or "Good"


def infer_origin_label(
  text: str,
  origin_code: str = "",
  existing: str = "",
) -> str:
  value = (existing or "").strip()
  if value and value != DEFAULT_ORIGIN:
    return value

  try:
    code = int(origin_code) if origin_code not in ("", None) else None
  except (TypeError, ValueError):
    code = None
  if code is not None and ORIGIN_LABELS.get(code):
    return ORIGIN_LABELS[code]

  lower = text.lower()
  for label, keys in ORIGIN_TEXT_KEYWORDS.items():
    if any(k in lower for k in keys):
      return label
  return DEFAULT_ORIGIN


def infer_warranty_label(
  text: str,
  warranty_code: str = "",
  existing: str = "",
) -> str:
  value = (existing or "").strip()
  if value and value != DEFAULT_WARRANTY:
    return value

  try:
    code = int(warranty_code) if warranty_code not in ("", None) else None
  except (TypeError, ValueError):
    code = None
  if code is not None and WARRANTY_LABELS.get(code):
    return WARRANTY_LABELS[code]

  lower = text.lower()
  for label, keys in WARRANTY_TEXT_KEYWORDS.items():
    if any(k in lower for k in keys):
      return label
  return DEFAULT_WARRANTY


def normalize_model(raw: str, title: str, brand: str) -> str:
  model = (raw or "").strip()
  title = (title or "").strip()
  if not model or model == title:
    model = title
  if brand and brand != DEFAULT_BRAND_ENUM:
    prefix = brand.lower()
    low = model.lower()
    if low.startswith(prefix + " "):
      model = model[len(brand) :].strip()
  model = re.sub(r"\s+", " ", model).strip()
  return model[:255] if model else "Unknown"


def enrich_from_extra_json(row: dict[str, str]) -> dict[str, str]:
  """Fill capacity/year from extra_attributes_json when present."""
  raw = (row.get("extra_attributes_json") or "").strip()
  if not raw:
    return row
  try:
    extra = json.loads(raw)
  except json.JSONDecodeError:
    return row

  if not isinstance(extra, dict):
    return row

  if not (row.get("capacity") or "").strip():
    for key in ("RAM", "Bộ nhớ", "Dung lượng", "Ổ cứng"):
      val = extra.get(key)
      if val and re.search(r"\d", str(val)):
        row["capacity"] = str(val)
        break

  if not (row.get("manufacture_year") or "").strip():
    for key in ("Năm sản xuất", "Đời", "Năm"):
      val = extra.get(key)
      if val:
        y = _valid_year(re.search(r"\d{4}", str(val)).group(0) if re.search(r"\d{4}", str(val)) else "")
        if y:
          row["manufacture_year"] = y
          break

  return row


def enrich_row(row: dict[str, str]) -> tuple[dict[str, str], dict[str, int]]:
  """Apply all field normalizations; return row and per-field change flags."""
  stats: dict[str, int] = {}
  title = (row.get("title") or "").strip()
  description = (row.get("description") or "").replace("\n", " ").replace("\r", " ").strip()
  text = _merge_text(title, description)
  subcat = row.get("sl_sub_category_id", "")

  row = dict(row)
  row = enrich_from_extra_json(row)

  def _set(field: str, new: str) -> None:
    old = (row.get(field) or "").strip()
    row[field] = new
    if new != old:
      stats[f"{field}_updated"] = stats.get(f"{field}_updated", 0) + 1

  old_brand = (row.get("brand") or "").strip()
  brand = normalize_brand(old_brand, title, description)
  _set("brand", brand)
  if brand != old_brand and brand != DEFAULT_BRAND_ENUM and old_brand in ("", DEFAULT_BRAND_ENUM, "Khác"):
    stats["brand_inferred_from_text"] = stats.get("brand_inferred_from_text", 0) + 1

  _set("model", normalize_model(row.get("model", ""), title, brand))
  _set(
    "capacity",
    infer_capacity_label(text, subcat, row.get("capacity", "")),
  )
  _set("color", infer_color(text, row.get("color", "")))
  _set(
    "manufacture_year",
    infer_manufacture_year(
      text,
      subcat,
      row.get("manufacture_year", ""),
      row.get("posted_at_ms", ""),
    ),
  )
  _set(
    "sl_condition",
    infer_sl_condition(text, row.get("condition_code", ""), row.get("sl_condition", "")),
  )
  _set(
    "origin_label",
    infer_origin_label(text, row.get("origin_code", ""), row.get("origin_label", "")),
  )
  _set(
    "warranty_label",
    infer_warranty_label(text, row.get("warranty_code", ""), row.get("warranty_label", "")),
  )

  row["description"] = description
  row["region_name"] = (row.get("region_name") or "").strip() or "Unknown"
  return row, stats
