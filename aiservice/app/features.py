"""Feature engineering for phone price pipeline v10 (Chợ Tốt)."""

from __future__ import annotations

import re
from typing import Any, Optional

import numpy as np

from .config import CURRENT_YEAR, PRICE_MAX, PRICE_MIN

POSITIVE_KW = [
    "fullbox", "full box", "nguyên seal", "newseal", "new seal", "zin",
    "keng", "như mới", "like new", "likenew", "chính hãng", "vn/a",
    "còn bảo hành", "bảo hành", "nguyên zin", "chưa qua sửa", "chưa sửa",
]
DEFECT_KW = [
    "trầy xước", "trầy", "xước", "nứt", "vỡ", "rạn", "lỗi", "ám màn", "sọc màn",
    "liệt", "chai pin", "đã thay pin", "thay pin", "dính icloud", "ẩn icloud",
    "lỗi face", "trục trặc", "móp", "hư hỏng",
]

CHIP_GEN_MAP = {
    "a8": 1, "a9": 1, "a10": 2, "a11": 2, "a12": 3, "a13": 3, "a14": 4, "a15": 4, "a16": 5, "a17": 5,
    "iphone 6": 1, "iphone 7": 1, "iphone 8": 2, "iphone x ": 2, "iphone xs": 2, "iphone xr": 2,
    "iphone 11": 3, "iphone 12": 3, "iphone se": 2, "iphone 13": 4, "iphone 14": 4, "iphone 15": 5, "iphone 16": 5,
    "625": 1, "660": 1, "665": 1, "675": 2, "720": 2, "730": 2, "732": 2,
    "750": 3, "778": 3, "780": 3, "765": 3, "855": 3, "860": 3, "865": 4, "870": 4, "888": 4,
    "8 gen 1": 4, "8+ gen 1": 4, "8 gen 2": 5, "8 gen 3": 5, "4 gen 1": 3, "4 gen 2": 4, "6 gen 1": 3,
    "700": 2, "810": 2, "900": 3, "920": 3, "1000": 3, "1100": 3,
    "1200": 4, "1300": 4, "8050": 4, "8100": 4, "8200": 4, "9000": 5, "9200": 5, "9300": 5,
    "9610": 2, "9611": 2, "9820": 3, "9825": 3, "990": 3, "2100": 4, "2200": 4, "2400": 5,
    "710": 2, "960": 3, "970": 3, "980": 4,
    "g80": 2, "g85": 2, "g88": 2, "g90": 2, "g95": 3, "g96": 3, "g99": 4, "p70": 2, "p90": 2,
}

CONDITION_MAP = {"Like New": 3, "Good": 2, "Fair": 1, "New": 3, "Poor": 1}

BRAND_ALIASES = {
    "apple": "APPLE",
    "samsung": "SAMSUNG",
    "xiaomi": "XIAOMI",
    "oppo": "OPPO",
    "vivo": "VIVO",
    "huawei": "HUAWEI",
    "nokia": "NOKIA",
    "realme": "REALME",
    "oneplus": "ONEPLUS",
    "sony": "SONY",
    "asus": "ASUS",
    "dell": "DELL",
    "hp": "HP",
    "lenovo": "LENOVO",
    "acer": "ACER",
    "msi": "MSI",
    "lg": "LG",
    "other": "OTHER",
    "khác": "OTHER",
}

COLOR_ALIASES = {
    "black": "đen", "white": "trắng", "blue": "xanh dương", "green": "xanh lá",
    "red": "đỏ", "gold": "vàng", "silver": "bạc", "pink": "hồng", "purple": "tím",
    "gray": "xám", "grey": "xám", "orange": "cam", "yellow": "vàng",
}

RAM_BINS = [0, 2.5, 3.5, 5, 7, 10, 14, 24, 999]
RAM_VALS = [2, 3, 4, 6, 8, 12, 16, 32]

_BAT1 = re.compile(r"(?:pin|battery|sức khỏe|sk pin|dung lượng pin)[^\d%]{0,8}(\d{2,3})\s*%")
_BAT2 = re.compile(r"(\d{2,3})\s*%\s*pin")
_STORAGE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(gb|tb)\b", re.I)


def normalize_region(region_name: Optional[str]) -> str:
    if not region_name:
        return "Khác"
    r = str(region_name)
    if "Hồ Chí Minh" in r or "HCM" in r or "ho chi minh" in r.lower():
        return "HCM"
    if "Hà Nội" in r or "Ha Noi" in r.lower() or "ha noi" in r.lower():
        return "HN"
    if "Đà Nẵng" in r or "Da Nang" in r.lower():
        return "ĐN"
    return "Khác"


def normalize_color(color: Optional[str]) -> str:
    if not color or not str(color).strip():
        return "__NA__"
    raw = str(color).strip().lower()
    return COLOR_ALIASES.get(raw, raw)


def normalize_brand(brand: Optional[str]) -> str:
    if not brand:
        return "OTHER"
    raw = str(brand).strip()
    key = raw.lower()
    if key in BRAND_ALIASES:
        return BRAND_ALIASES[key]
    upper = raw.upper()
    return upper if upper else "OTHER"


def normalize_condition(condition: Optional[str]) -> str:
    if not condition:
        return "Good"
    value = str(condition).strip()
    for key in CONDITION_MAP:
        if key.lower() == value.lower():
            return key
    return "Good"


def round_ram(value: Optional[float]) -> float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 4.0
    for i, bound in enumerate(RAM_BINS[1:]):
        if value <= bound:
            return float(RAM_VALS[i])
    return 32.0


def parse_storage_gb(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)) and not (isinstance(value, float) and np.isnan(value)):
        n = float(value)
        return n * 1024 if 0 < n <= 2 else n
    raw = str(value).upper().replace(" ", "")
    if "TB" in raw:
        try:
            return float(raw.replace("TB", "")) * 1024
        except ValueError:
            return None
    try:
        return float(raw.replace("GB", "").replace("MB", ""))
    except ValueError:
        m = _STORAGE_RE.search(str(value))
        if not m:
            return None
        n = float(m.group(1))
        return n * 1024 if m.group(2).lower() == "tb" else n


def merge_text(title: str = "", description: str = "") -> str:
    return f"{title or ''} {description or ''}".strip().lower()


def extract_battery(text: str) -> float:
    if not text:
        return np.nan
    for rgx in (_BAT1, _BAT2):
        m = rgx.search(text)
        if m:
            v = int(m.group(1))
            if 50 <= v <= 100:
                return float(v)
    return np.nan


def parse_year_from_text(text: str) -> Optional[int]:
    if not text:
        return None
    matches = re.findall(r"\b(201[5-9]|202[0-5])\b", text)
    return int(matches[-1]) if matches else None


def compute_age_years(
    manufacture_year: Optional[int],
    title: str = "",
    description: str = "",
    age_median: float = 2.0,
) -> tuple[float, int]:
    text_year = parse_year_from_text(merge_text(title, description))
    year = manufacture_year if manufacture_year and manufacture_year > 2010 else text_year
    if year:
        age = float(max(0, min(12, CURRENT_YEAR - year)))
        return age, 1
    return float(age_median), 0


def extract_chip_gen(processor: Optional[str], model_name: str) -> float:
    combined = " ".join([
        str(processor).lower() if processor else "",
        str(model_name).lower() if model_name else "",
    ])
    for kw, gen in CHIP_GEN_MAP.items():
        if kw in combined:
            return float(gen)
    return np.nan


def safe_label_encode(encoder, value: str) -> int:
    v = str(value)
    if v in encoder.classes_:
        return int(encoder.transform([v])[0])
    return int(encoder.transform([encoder.classes_[0]])[0])


def build_feature_row(
    *,
    model_name: str,
    brand: str,
    ram_gb: float,
    storage_gb: float,
    sl_condition: str,
    age_years: float,
    is_age_known: int,
    color: str,
    screen_inches: float,
    origin_code: int,
    warranty_code: int,
    region: str,
    sim_lock: str,
    num_images: float,
    has_video: float,
    title: str,
    description: str,
    encoders: dict,
    brand_chip_median: dict,
    global_chip_median: float,
) -> dict[str, Any]:
    text = merge_text(title, description)
    cond_label = normalize_condition(sl_condition)
    cond = CONDITION_MAP.get(cond_label, 1)

    chip = extract_chip_gen(None, model_name)
    if np.isnan(chip):
        chip = float(brand_chip_median.get(brand, global_chip_median))

    bat = extract_battery(text)
    q = sum(k in text for k in POSITIVE_KW)
    d = sum(k in text for k in DEFECT_KW)

    return {
        "model": str(model_name).lower().strip(),
        "color": normalize_color(color),
        "brand_enc": safe_label_encode(encoders["brand"], brand),
        "sl_condition_enc": safe_label_encode(encoders["sl_condition"], cond_label),
        "region_group_enc": safe_label_encode(encoders["region_group"], region),
        "sim_lock_enc": safe_label_encode(encoders["sim_lock"], sim_lock or "Unknown"),
        "ram_gb": ram_gb,
        "storage_gb": storage_gb,
        "screen_inches": screen_inches,
        "condition_score": cond,
        "age_years": age_years,
        "is_age_known": is_age_known,
        "chip_gen": chip,
        "chip_x_age": chip / (age_years + 1),
        "origin_code": origin_code,
        "is_official": int(origin_code == 1),
        "warranty_code": warranty_code,
        "has_warranty": int(warranty_code > 0),
        "spec_score": ram_gb * np.log1p(storage_gb),
        "depreciation_score": age_years * (1 - cond / 3),
        "num_images": num_images,
        "has_video": has_video,
        "title_quality_score": q,
        "title_defect_score": d,
        "has_battery_info": int(not np.isnan(bat)),
        "battery_pct": bat,
    }


def parse_xgb_base_score(raw: Any) -> float:
    """Parse XGBoost base_score from config (handles '5E-1', '[1.5559938E1]', etc.)."""
    if raw is None:
        return float("nan")
    if isinstance(raw, (int, float)):
        return float(raw)
    s = str(raw).strip()
    if s.startswith("[") and s.endswith("]"):
        s = s[1:-1].strip()
    if "," in s:
        s = s.split(",")[0].strip()
    return float(s)


def clip_predicted_log(pred_log: float) -> float:
    return float(np.clip(pred_log, np.log1p(PRICE_MIN * 0.5), np.log1p(PRICE_MAX * 1.2)))


def log_to_vnd(pred_log: float) -> int:
    return int(round(float(np.expm1(clip_predicted_log(pred_log)))))
