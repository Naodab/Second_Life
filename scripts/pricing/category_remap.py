"""Re-map Chợ Tốt / Second Life categories using API cg + title heuristics."""

from __future__ import annotations

import re
from typing import Any

from chotot_config import CATEGORY_BY_CG, CategoryMapping

# Title patterns — first strong match wins for cross-listed ads.
_LAPTOP_RE = re.compile(
  r"laptop|macbook|thinkpad|latitude|vivobook|zenbook|ideapad|"
  r"surface book|notebook|xps\b|pavilion|elitebook|probook|legion|"
  r"\bkatana\b|\bnitro\b|precision\s*\d|core\s*i[3579]|rtx\s*\d|gtx\s*\d",
  re.IGNORECASE,
)
_TABLET_RE = re.compile(
  r"\bipad\b|tablet|máy tính bảng|tab\s*s\d|galaxy\s*tab",
  re.IGNORECASE,
)
_CAR_RE = re.compile(
  r"lexus|mercedes|porsche|bmw\b|audi\b|land\s*rover|range\s*rover|"
  r"vinfast\s*vf|toyota\s*(camry|vios|fortuner|innova|hilux)|"
  r"honda\s*(civic|accord|city|cr-?v|hr-?v)|mazda\s*\d|hyundai|kia\s|"
  r"ford\s*ranger|ô\s*tô|xe\s*hơi|\bsuv\b|\bsedan\b|"
  r"macan|cayenne|\bgle\d|\bgls\d|\bes\d{3}|rx\d{3}|accord|civic|"
  r"oto\s|4\s*chỗ|7\s*chỗ|xe\s*tải",
  re.IGNORECASE,
)
_MOTO_RE = re.compile(
  r"xe\s*máy|xe\s*moto|\bwave\b|\bvision\b|air\s*blade|exciter|winner|"
  r"raider|satria|sh\s*mode|\bpcx\b|\badv\b|sirius|dream\s*\d|"
  r"grande|click\s*\d|lead\s*\d{3}|vario",
  re.IGNORECASE,
)

# Chợ Tốt cg for cars (for future crawl); SL mapping when title says car but crawled as moto.
_SL_CAR = ("cat-vehicle", "Xe cộ & Phương tiện", "sub-car", "Ô tô")


def _text_blob(merged: dict[str, Any]) -> str:
  return f"{merged.get('subject', '')} {merged.get('body', '')}".strip()


def _text_blob_row(row: dict[str, str]) -> str:
  return f"{row.get('title', '')} {row.get('description', '')}".strip()


def _parse_cg(value: Any, fallback: int) -> int:
  try:
    return int(value) if value not in (None, "") else fallback
  except (TypeError, ValueError):
    return fallback


def mapping_for_cg(cg: int, fallback: CategoryMapping) -> CategoryMapping:
  return CATEGORY_BY_CG.get(cg, fallback)


def _apply_mapping_fields(target: dict[str, str], mapping: CategoryMapping, cg: int) -> None:
  target["chotot_category_id"] = str(cg)
  target["chotot_category_name"] = mapping.chotot_name
  target["sl_category_id"] = mapping.sl_category_id
  target["sl_category_name"] = mapping.sl_category_name
  target["sl_sub_category_id"] = mapping.sl_sub_category_id
  target["sl_sub_category_name"] = mapping.sl_sub_category_name


def _apply_sl_car(target: dict[str, str]) -> None:
  cat_id, cat_name, sub_id, sub_name = _SL_CAR
  target["sl_category_id"] = cat_id
  target["sl_category_name"] = cat_name
  target["sl_sub_category_id"] = sub_id
  target["sl_sub_category_name"] = sub_name


def resolve_mapping_from_ad(merged: dict[str, Any], crawl_mapping: CategoryMapping) -> CategoryMapping:
  """Pick SL mapping from ad category + title (used when crawling)."""
  cg = _parse_cg(merged.get("category"), crawl_mapping.chotot_cg)
  mapping = mapping_for_cg(cg, crawl_mapping)
  text = _text_blob(merged)
  price = merged.get("price")

  if mapping.sl_sub_category_id == "sub-tablet" and _LAPTOP_RE.search(text) and not _TABLET_RE.search(text):
    return CATEGORY_BY_CG[5040]

  vehicle = _resolve_vehicle_sub(text, price, mapping.sl_sub_category_id)
  if vehicle == "sub-car":
    return _car_mapping_fallback(crawl_mapping)
  if vehicle == "sub-motorcycle" and mapping.sl_sub_category_id == "sub-car":
    return CATEGORY_BY_CG[2010]

  return mapping


def _car_mapping_fallback(fallback: CategoryMapping) -> CategoryMapping:
  """Synthetic mapping for car sub-category (no dedicated Chợ Tốt cg in pricing crawl)."""
  return CategoryMapping(
    chotot_cg=fallback.chotot_cg,
    chotot_name=fallback.chotot_name,
    sl_category_id=_SL_CAR[0],
    sl_category_name=_SL_CAR[1],
    sl_sub_category_id=_SL_CAR[2],
    sl_sub_category_name=_SL_CAR[3],
  )


def _resolve_vehicle_sub(text: str, price: Any, current_sub: str) -> str | None:
  moto = bool(_MOTO_RE.search(text))
  car = bool(_CAR_RE.search(text))
  try:
    price_f = float(price) if price not in (None, "") else 0.0
  except (TypeError, ValueError):
    price_f = 0.0

  # Car ads often mention "xe máy số" (automatic gearbox) — do not treat as motorcycle.
  if car and (not moto or price_f >= 50_000_000):
    return "sub-car"
  if current_sub == "sub-motorcycle" and price_f >= 300_000_000 and not moto:
    return "sub-car"
  if moto and not car:
    return "sub-motorcycle"
  if moto and current_sub == "sub-car" and price_f < 50_000_000:
    return "sub-motorcycle"
  return None


def remap_row_categories(row: dict[str, str], crawl_cg: int | None = None) -> dict[str, str]:
  """
  Fix sl_* columns on an existing CSV row.
  Returns stats dict with optional keys: remapped_from_cg, laptop_from_tablet, car_from_moto.
  """
  out = dict(row)
  fallback_cg = crawl_cg or _parse_cg(out.get("chotot_category_id"), 0)
  fallback = CATEGORY_BY_CG.get(fallback_cg) or next(iter(CATEGORY_BY_CG.values()))
  cg = _parse_cg(out.get("chotot_category_id"), fallback.chotot_cg)
  mapping = mapping_for_cg(cg, fallback)
  stats: dict[str, int] = {}

  old_sub = out.get("sl_sub_category_id", "")
  if (
    out.get("sl_sub_category_id") != mapping.sl_sub_category_id
    or out.get("sl_category_id") != mapping.sl_category_id
  ):
    stats["remapped_from_cg"] = 1

  _apply_mapping_fields(out, mapping, cg)

  text = _text_blob_row(out)
  try:
    price = float(out.get("price_vnd") or 0)
  except ValueError:
    price = 0.0

  if out["sl_sub_category_id"] == "sub-tablet" and _LAPTOP_RE.search(text) and not _TABLET_RE.search(text):
    lap = CATEGORY_BY_CG[5040]
    _apply_mapping_fields(out, lap, 5040)
    stats["laptop_from_tablet"] = 1

  vehicle = _resolve_vehicle_sub(text, price, out["sl_sub_category_id"])
  if vehicle == "sub-car" and out["sl_sub_category_id"] != "sub-car":
    _apply_sl_car(out)
    stats["car_from_moto"] = 1
  elif vehicle == "sub-motorcycle" and out["sl_sub_category_id"] == "sub-car":
    moto = CATEGORY_BY_CG[2010]
    _apply_mapping_fields(out, moto, 2010)
    stats["moto_from_car"] = 1

  if out.get("sl_sub_category_id") != old_sub and "remapped_from_cg" not in stats:
    stats["remapped_heuristic"] = 1

  return out, stats
