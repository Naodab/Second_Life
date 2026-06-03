"""Chợ Tốt → Second Life category config for pricing data crawl."""

from __future__ import annotations

from dataclasses import dataclass

DEFAULT_BRAND_ENUM = "OTHER"


@dataclass(frozen=True)
class CategoryMapping:
  chotot_cg: int
  chotot_name: str
  sl_category_id: str
  sl_category_name: str
  sl_sub_category_id: str
  sl_sub_category_name: str


# (cg, Chợ Tốt name, sl_cat_id, sl_cat_name, sl_sub_id, sl_sub_name)
_CATEGORY_ROWS: list[tuple] = [
  # Electronics
  (5010, "Điện thoại", "cat-electronics", "Điện tử - Điện máy", "sub-phone", "Điện thoại & Phụ kiện"),
  (5030, "Máy tính bảng", "cat-electronics", "Điện tử - Điện máy", "sub-tablet", "Máy tính bảng"),
  (5040, "Laptop", "cat-electronics", "Điện tử - Điện máy", "sub-laptop", "Máy tính & Laptop"),
  (5050, "Màn hình, Máy in", "cat-electronics", "Điện tử - Điện máy", "sub-tv", "Tivi & Màn hình"),
  (5060, "Máy ảnh, Máy quay", "cat-electronics", "Điện tử - Điện máy", "sub-camera", "Máy ảnh & Quay phim"),
  (5070, "Thiết bị âm thanh", "cat-electronics", "Điện tử - Điện máy", "sub-home-appliance", "Thiết bị gia dụng"),
  # Fashion
  (3000, "Thời trang", "cat-fashion", "Thời trang & Phụ kiện", "sub-women-clothing", "Quần áo nữ"),
  (3030, "Quần áo", "cat-fashion", "Thời trang & Phụ kiện", "sub-men-clothing", "Quần áo nam"),
  (3060, "Giày dép", "cat-fashion", "Thời trang & Phụ kiện", "sub-shoes", "Giày dép"),
  (3070, "Túi xách", "cat-fashion", "Thời trang & Phụ kiện", "sub-bag", "Túi xách & Balo"),
  # Watches / fashion accessories share sub-bag (no dedicated watch sub-category in SL seed).
  (3050, "Đồng hồ", "cat-fashion", "Thời trang & Phụ kiện", "sub-bag", "Túi xách & Balo"),
  (3090, "Phụ kiện thời trang", "cat-fashion", "Thời trang & Phụ kiện", "sub-bag", "Túi xách & Balo"),
  # Home
  (14010, "Nội thất", "cat-home", "Nhà cửa & Nội thất", "sub-furniture-living", "Nội thất phòng khách"),
  (14020, "Dụng cụ nhà bếp", "cat-home", "Nhà cửa & Nội thất", "sub-kitchen", "Đồ dùng nhà bếp"),
  (14030, "Giường, chăn ga", "cat-home", "Nhà cửa & Nội thất", "sub-furniture-bedroom", "Nội thất phòng ngủ"),
  # Vehicles
  (2010, "Xe máy", "cat-vehicle", "Xe cộ & Phương tiện", "sub-motorcycle", "Xe máy"),
  (2020, "Xe đạp", "cat-vehicle", "Xe cộ & Phương tiện", "sub-bike", "Xe đạp & Xe điện"),
  (2030, "Phụ tùng xe", "cat-vehicle", "Xe cộ & Phương tiện", "sub-auto-part", "Phụ tùng xe"),
  # Sports & entertainment
  (9030, "Thể thao", "cat-sports", "Thể thao & Du lịch", "sub-fitness", "Dụng cụ thể thao & Gym"),
  (8010, "Game & Console", "cat-books", "Sách & Giải trí", "sub-games", "Game & Console"),
  (8030, "Sách", "cat-books", "Sách & Giải trí", "sub-books", "Sách cũ"),
  # Mother & baby
  (11010, "Mẹ và bé", "cat-mother-baby", "Mẹ & Bé", "sub-baby-stuff", "Đồ dùng cho bé"),
  # Beauty
  (3080, "Nước hoa", "cat-beauty", "Mỹ phẩm & Chăm sóc sức khỏe", "sub-cosmetics", "Mỹ phẩm & Skincare"),
]

CATEGORIES: list[CategoryMapping] = [
  CategoryMapping(cg, name, cat_id, cat_name, sub_id, sub_name)
  for cg, name, cat_id, cat_name, sub_id, sub_name in _CATEGORY_ROWS
]

CATEGORY_BY_CG: dict[int, CategoryMapping] = {c.chotot_cg: c for c in CATEGORIES}

CHOTOT_API_LIST = "https://gateway.chotot.com/v1/public/ad-listing"
CHOTOT_API_DETAIL = "https://gateway.chotot.com/v1/public/ad-listing/{list_id}"

HEADERS = {
  "User-Agent": (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ),
  "Accept": "application/json",
  "Accept-Language": "vi-VN,vi;q=0.9",
}

# Chợ Tốt elt_condition → label + Second Life Condition attribute map
CONDITION_LABELS: dict[int, str] = {
  1: "Mới",
  2: "Đã sử dụng",
  3: "Tân trang",
}

SL_CONDITION_MAP: dict[int, str] = {
  1: "New",
  2: "Good",
  3: "Like New",
}

ORIGIN_LABELS: dict[int, str] = {
  1: "Chính hãng",
  2: "Xách tay",
  3: "Nhập khẩu",
  4: "Lắp ráp",
  5: "Không rõ",
  6: "Chính hãng VN",
}

WARRANTY_LABELS: dict[int, str] = {
  1: "Không bảo hành",
  2: "Còn bảo hành",
  3: "Hết bảo hành",
}

# Canonical brand enums for modeling/training.
# The crawler will infer these from title/description when API params are missing.
BRAND_ENUM_KEYWORDS: dict[str, tuple[str, ...]] = {
  # Phones & computers
  "APPLE": ("apple", "iphone", "ipad", "macbook", "imac", "airpods", "apple watch"),
  "SAMSUNG": ("samsung", "galaxy s", "galaxy a", "galaxy z", "galaxy note"),
  "XIAOMI": ("xiaomi", "redmi", "poco"),
  "OPPO": ("oppo", "reno", "find x", "find n"),
  "VIVO": ("vivo",),
  "HUAWEI": ("huawei", "honor"),
  "NOKIA": ("nokia",),
  "REALME": ("realme",),
  "ONEPLUS": ("oneplus", "one plus"),
  "SONY": ("sony", "xperia", "playstation", "ps4", "ps5", "ps5"),
  "ASUS": ("asus", "rog phone", "rog ", "zenfone"),
  "DELL": ("dell", "xps", "inspiron", "latitude", "alienware"),
  "HP": (" hp ", "hewlett", "pavilion", "elitebook", "probook", "omen "),
  "LENOVO": ("lenovo", "thinkpad", "ideapad", "legion", "loq "),
  "ACER": ("acer", "nitro", "predator"),
  "MSI": ("msi",),
  "CANON": ("canon", "eos ", "powershot"),
  "NIKON": ("nikon",),
  "FUJIFILM": ("fujifilm", "fuji "),
  "PANASONIC": ("panasonic",),
  "LG": (" lg ", "lg gram", "lg oled"),
  # Home appliances
  "PHILIPS": ("philips",),
  "TOSHIBA": ("toshiba",),
  "SHARP": ("sharp",),
  "ELECTROLUX": ("electrolux",),
  "MIDEA": ("midea",),
  "SUNHOUSE": ("sunhouse",),
  "BLUESTONE": ("bluestone",),
  "HITACHI": ("hitachi",),
  "TEFAL": ("tefal",),
  # Vehicles (moto + car keywords in title)
  "HONDA": ("honda", "wave ", "vision ", "air blade", "sh mode", "pcx ", "vario"),
  "YAMAHA": ("yamaha", "exciter", "sirius", "grande", "janus"),
  "SUZUKI": ("suzuki", "raider", "satria", "impulse"),
  "SYM": (" sym ", "sym attila"),
  "PIAGGIO": ("piaggio", "vespa", "liberty "),
  "VINFAST": ("vinfast", "vf "),
  "TOYOTA": ("toyota", "vios", "camry", "fortuner", "innova", "hilux", "corolla"),
  "FORD": ("ford", "ranger", "everest", "ecosport"),
  "HYUNDAI": ("hyundai", "accent", "creta", "tucson", "santa fe"),
  "KIA": ("kia", "morning", "seltos", "sorento", "carnival"),
  "MAZDA": ("mazda",),
  "MITSUBISHI": ("mitsubishi", "xpander", "triton", "pajero"),
  "NISSAN": ("nissan", "navara", "terra", "almera"),
  "MERCEDES": ("mercedes", "benz", "amg"),
  "BMW": ("bmw",),
  "LEXUS": ("lexus",),
  "CHEVROLET": ("chevrolet", "colorado", "spark", "cruze"),
  "ISUZU": ("isuzu", "d-max"),
  "PEUGEOT": ("peugeot",),
  # Fashion (common on Chợ Tốt)
  "NIKE": ("nike", "air force", "air max", "jordan "),
  "ADIDAS": ("adidas", "ultraboost", "stan smith"),
  "OTHER": (),
}


def infer_brand_from_text(text: str) -> str:
  """Map title/description to canonical brand enum."""
  normalized = f" {text.lower()} "
  for enum_name, keys in BRAND_ENUM_KEYWORDS.items():
    if enum_name == DEFAULT_BRAND_ENUM:
      continue
    for key in keys:
      token = f" {key} " if key.isalpha() and len(key) <= 3 else key
      if token in normalized:
        return enum_name
  return DEFAULT_BRAND_ENUM

# CSV columns — fixed order for ML pipeline
CSV_COLUMNS: list[str] = [
  "source",
  "source_list_id",
  "source_ad_id",
  "title",
  "description",
  "price_vnd",
  "price_string",
  "listing_type",
  "chotot_category_id",
  "chotot_category_name",
  "sl_category_id",
  "sl_category_name",
  "sl_sub_category_id",
  "sl_sub_category_name",
  "condition_code",
  "condition_label",
  "sl_condition",
  "origin_code",
  "origin_label",
  "warranty_code",
  "warranty_label",
  "brand",
  "model",
  "capacity",
  "color",
  "manufacture_year",
  "extra_attributes_json",
  "region_name",
  "area_name",
  "ward_name",
  "latitude",
  "longitude",
  "num_images",
  "has_video",
  "posted_at_ms",
  "thumbnail_url",
  "image_urls",
  "crawled_at",
]
