#!/usr/bin/env python3
"""
Re-classify categories in raw_products.json based on product name keywords.
Removes: vouchers, food, non-goods items.

Run: python3 fix_categories.py
"""
from __future__ import annotations

import json
import re
import logging
from pathlib import Path
from collections import Counter

from category_registry import SUB_TO_PARENT, normalize_product_categories, is_valid_sub_category

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

INPUT_FILE  = Path(__file__).parent / "data" / "raw_products.json"
OUTPUT_FILE = Path(__file__).parent / "data" / "raw_products.json"  # overwrite in-place

# ──────────────────────────────────────────────────────────────────────────────
# 1. REMOVE rules – products matching any keyword are dropped
# ──────────────────────────────────────────────────────────────────────────────
REMOVE_PATTERNS = [
  # Việc làm / thuê người / dịch vụ (Chợ Tốt hay lẫn — loại bỏ hết)
  r"thuê việc", r"tìm việc", r"việc làm", r"cần tuyển", r"tuyển dụng",
  r"tuyển gấp", r"tim viec", r"cần người", r"thuê người", r"thuê lao động",
  r"làm thêm", r"part[\s-]?time", r"full[\s-]?time", r"công nhân",
  r"bảo vệ", r"giúp việc", r"chăm bé", r"chăm sóc người già",
  r"dọn dẹp nhà", r"vệ sinh công nghiệp", r"massage tại nhà",
  # Voucher / gift card
  r"vé xem phim", r"evoucher", r"giftpop", r"phiếu quà tặng", r"phiếu quà",
  r"voucher", r"coupon",
  # Thực phẩm tươi sống / đồ ăn
  r"cánh gà", r"cá ngát", r"cá gáy", r"cá chẽm", r"cá tra", r"cá viên",
  r"phi lê cá", r"phi lê", r"thịt bò", r"thịt heo", r"thịt gà", r"thịt lợn",
  r"mứt gừng", r"mứt dừa", r"mứt ",
  r"nước mắm", r"dầu ăn", r"mì gói", r"bún gạo", r"hạt nêm",
  r"cánh gà ta", r"gò công",
  r"seaprodex", r"người giữ rừng",  # thương hiệu thực phẩm
  # Thuốc / thực phẩm chức năng (không phải skincare)
  r"viên uống đau nhức", r"thuốc xương khớp", r"thống phong đan",
  r"du zhong", r"cốt toái",
  # Vé / dịch vụ phi vật chất
  r"vé cgv", r"lotteria", r"san fu lou", r"bác tôm", r"chicken plus",
  # Phần mềm / bản quyền số (không phải hàng hóa vật lý)
  r"phần mềm ", r"bản quyền", r"avast", r"kaspersky", r"bkav",
  r"microsoft 365", r"office home", r"phần mềm diệt virus",
  # Thực phẩm bổ sung (không bắt được lần đầu)
  r"cá lăng", r"ổi ruby", r"ổi ", r"đậu tươi", r"chanh có hạt",
  r"hành tây", r"mắm nêm", r"làng chài xưa",
  r"\d+g$", r"\d+kg$",  # products ending in "X00g" / "Xkg" are usually food
  r"toh fish", r"ruby \d+kg",
]

_REMOVE_RE = re.compile("|".join(REMOVE_PATTERNS), re.IGNORECASE)


def should_remove(name: str) -> bool:
  return bool(_REMOVE_RE.search(name))


# ──────────────────────────────────────────────────────────────────────────────
# 2. CATEGORY RULES – list of (sub_cat_id, cat_id, [keywords])
#    Order matters: first matching rule wins
# ──────────────────────────────────────────────────────────────────────────────
CATEGORY_RULES: list[tuple[str, str, list[str]]] = [
  # ── Xe (ưu tiên trước điện tử — Chợ Tốt hay trộn tin xe vào category khác) ──
  ("sub-car", "cat-vehicle", [
    "ô tô", "xe hơi", "xe tải", "xe suv", "xe 4 chỗ", "xe 7 chỗ",
    "toyota ", "mazda ", "hyundai ", "kia ", "ford ", "vinfast ",
    "honda city", "honda civic", "honda accord", "honda cr-v",
    "innova", "vios", "fortuner", "camry", "cerato", "seltos",
    "mazda 3", "mazda 6", "mazda cx", "số tự động", "số sàn",
  ]),
  ("sub-motorcycle", "cat-vehicle", [
    "xe máy", "xe moto", "scooter", "xe ga ", "xe côn ", "xe số",
    "honda vision", "honda winner", "honda wave", "honda air blade",
    "honda sh ", "honda lead", "honda vario", "honda pcx",
    "yamaha exciter", "yamaha nvx", "yamaha janus", "yamaha grande",
    "suzuki ", "sym ", "piaggio ", "sh mode", "winner v", "vision 20",
    "exciter ", "air blade", "wave alpha",
  ]),
  ("sub-bike", "cat-vehicle", [
    "xe đạp", "xe điện", "xe đẩy đạp", "bicycle",
  ]),

  # ── Electronics ────────────────────────────────────────────────────────
  ("sub-phone", "cat-electronics", [
    "điện thoại", "iphone", "redmi ", "oppo ", "realme ", "vivo ",
    "huawei ", "samsung galaxy", "samsung note", "samsung s2", "samsung s3",
    "galaxy note", "galaxy s", "galaxy a", "galaxy z", "galaxy m",
    "nokia ", "motorola ", "poco ", "xiaomi ", "oneplus ",
    "note 10", "note 20", "note 9", "s23 ultra", "s22 ", "s21 ",
  ]),
  ("sub-laptop", "cat-electronics", [
    "laptop", "macbook", "máy tính xách tay", "notebook ",
    "asus tuf", "asus vivobook", "dell inspiron", "dell latitude",
    "lenovo thinkpad", "lenovo ideapad", "hp pavilion", "acer nitro",
    "gaming i5", "gaming i7", "rtx 20", "rtx 30", "rtx 40",
    "surface pro", "surface laptop", "surface book",
  ]),
  ("sub-tablet", "cat-electronics", [
    "máy tính bảng", "ipad ", "tablet ",
  ]),
  ("sub-camera", "cat-electronics", [
    "máy ảnh", "camera ", "máy quay", "ống kính", "lens ",
    "flycam", "drone ", "gopro", "action cam",
  ]),
  ("sub-home-appliance", "cat-electronics", [
    "máy lạnh", "điều hòa", "tủ lạnh", "máy giặt", "lò vi sóng",
    "nồi cơm điện", "nồi cơm ", "máy hút bụi", "ấm đun nước",
    "nồi chiên không khí", "nồi chiên", "quạt điện", "quạt đứng",
    "quạt trần", "bếp từ", "bếp hồng ngoại", "bếp điện", "bếp gas",
    "máy rửa bát", "máy pha cà phê", "máy sấy tóc", "máy uốn",
    "máy ép trái cây", "máy xay sinh tố", "lò nướng",
    "máy sấy bơm nhiệt", "tấm chắn gió điều hoà", "remote điều khiển",
    "máy scan", "máy quét tài liệu", "pin aa", "pin aaa", "pin sạc aa",
    # phụ kiện xe / xe → home-appliance vì không có sub khác
    "mũ bảo hiểm", "gương cầu lồi", "tam giác phản quang",
    "phụ kiện xe máy", "phụ kiện ô tô", "gương ô tô", "gương xe",
  ]),
  ("sub-tv", "cat-electronics", [
    "tivi", "ti vi", "smart tv", "oled tv", "qled", "màn hình gaming",
    "màn hình led", "màn hình lcd", "màn hình máy tính",
    "monitor ", "màn hình ", "anten thu sóng", "đầu thu",
    "dvb t2", "coocaa",
  ]),
  ("sub-laptop", "cat-electronics", [
    # máy in, linh kiện máy tính
    "hộp mực", "máy in ", "linh kiện máy tính", "card màn hình",
    "ram laptop", "ssd ", "ổ cứng",
  ]),

  # ── Sách & Entertainment ────────────────────────────────────────────────
  ("sub-books", "cat-books", [
    "sách ", " sách", "truyện tranh", "manga ", "light novel",
    "tiểu thuyết", "giáo trình", "nxb ", "nguyễn nhật ánh",
    "nxb trẻ", "tập đọc", "ship of theseus", "monster - deluxe",
    "tô màu ", "conan ", "hành trình yêu",
  ]),
  ("sub-games", "cat-books", [
    "playstation", "xbox ", "nintendo ", "máy chơi game",
    "ps4 ", "ps5 ", "ps3 ", "switch game", "gamepad",
    "tay cầm chơi game", "game console", "gaming chair",
  ]),

  # ── Mẹ & Bé ────────────────────────────────────────────────────────────
  ("sub-baby-stuff", "cat-mother-baby", [
    "sữa bột", "sữa dielac", "sữa anlene", "sữa vinamilk",
    "bỉm ", "tã ", "quần bỏ bỉm", "quần tập bỏ bỉm",
    "xe đẩy em bé", "địu em bé", "nôi em bé", "ghế ăn dặm",
    "bình sữa", "núm ti", "máy hâm sữa", "vỏ bỉm",
    "bộ quần áo bé",
  ]),

  # ── Thời trang – Giày trước toys (tránh "giày búp bê" → toys) ─────────
  ("sub-shoes", "cat-fashion", [
    "giày cao gót", "giày thể thao", "giày da nam", "giày da nữ",
    "giày lười", "giày bệt", "giày búp bê", "giày sneaker",
    "giày ", "dép eva", "dép quai hậu", "dép quai kẹp",
    "sandal ", "dép nam", "dép nữ", "boot ", "guốc ",
  ]),
  ("sub-toys", "cat-mother-baby", [
    "đồ chơi", "lego ", "robot đồ chơi", "búp bê", "xe đồ chơi",
    "bảng vẽ cho bé", "khối xếp hình", "đồ chơi trẻ em",
  ]),

  # ── Thể thao ───────────────────────────────────────────────────────────
  ("sub-fitness", "cat-sports", [
    "tạ bình vôi", "tạ tay", "tạ đòn", "tập gym", "yoga ",
    "dây nhảy", "xà đơn", "xà kép", "máy chạy bộ", "xe đạp tập",
    "bóng yoga", "vòng eo", "bao tay boxing", "thảm tập",
    "dây kháng lực", "dây đàn hồi tập", "vòng đu xà",
    "ghế tập gym", "gánh tạ",
    "vợt tennis", "vợt cầu lông", "vợt bóng bàn", "vợt pickleball",
    "bóng đá ", "bóng rổ", "bóng chuyền",
  ]),
  ("sub-camping", "cat-sports", [
    "lều cắm trại", "ba lô leo núi", "trekking", "leo núi",
    "túi ngủ", "bình nước thể thao", "đèn pin cắm trại",
  ]),

  # ── Thời trang (túi, quần áo) ──────────────────────────────────────────
  ("sub-bag", "cat-fashion", [
    "túi xách", "balo ", "ba lô ", "ví da ", "clutch ", "tote bag",
    "vali ", "hành lý", "túi đeo", "túi chéo",
    "thắt lưng", "dây lưng", "nón tai bèo", "nón lưỡi trai",
    "mũ chống nắng", "kẹp tóc", "cặp tóc", "cài tóc",
    "găng tay chống nắng", "găng tay lái xe",
    "khăn choàng", "khăn len",
    "túi chống sốc", "bao chống sốc macbook", "túi đựng laptop",
    "đồng hồ", "casio ", "omega ", "g-shock", "edifice", "seiko ",
    "vòng tay", "vòng cổ", "dây chuyền", "nhẫn ", "trang sức",
  ]),
  ("sub-women-clothing", "cat-fashion", [
    "áo ngực nữ", "quần lót nữ", "áo lót nữ", "quần lót chất",
    "váy ", "đầm ", "áo dài", "áo nữ ", "quần nữ ",
    "đồ ngủ nữ", "áo sơ mi nữ", "áo khoác nữ",
    "set đồ nữ", "bộ đồ nữ",
  ]),
  ("sub-men-clothing", "cat-fashion", [
    "áo thun nam", "áo polo nam", "áo sơ mi nam", "quần nam ",
    "quần short nam", "quần sịp nam", "áo điều hòa",
    "áo khoác nam", "áo chống nắng nam", "bộ áo điều hòa",
    "áo bơi nam", "quần bơi nam",
    "quần thể thao nam", "bộ đồ nam",
    "quần short", "quần jeans", "quần đùi", "áo thun ", "áo khoác ",
    "áo len ", "hoodie", "sweater",
  ]),

  # ── Nhà cửa ────────────────────────────────────────────────────────────
  ("sub-kitchen", "cat-home", [
    "bộ nồi", "nồi ", "chảo ", "dao bếp", "thớt ",
    "bình giữ nhiệt", "cốc giữ nhiệt", "hộp cơm", "hộp đựng thực phẩm",
    "bình đựng thức ăn", "hộp bảo quản", "ly nhựa", "ly uống nước",
    "cốc uống", "ấm trà", "bình trà",
    "bát ", "đĩa sứ", "dụng cụ làm bánh", "máy đánh trứng",
    "dụng cụ mài dao", "mài dao", "locknlock", "elmich",
    "túi đựng rau", "găng tay cao su",
  ]),
  ("sub-furniture-living", "cat-home", [
    "sofa", "bộ sofa", "kệ sách", "kệ tủ", "tủ quần áo",
    "bàn làm việc", "ghế văn phòng", "ghế gaming",
    "đèn ngủ", "đèn bàn", "đèn học", "nệm ", "gối ngủ", "chăn ",
    "bộ ga gối", "rèm cửa", "màn cửa",
  ]),
  ("sub-home-decor", "cat-home", [
    "tranh treo tường", "gương treo", "bình hoa", "lọ hoa",
    "đèn trang trí", "nước hoa xịt phòng", "tinh dầu khuếch tán",
    "đèn thờ", "tượng phong thủy", "đèn led dây",
    "đèn fairy light", "nhang sạch", "nhang sen", "trầm hương",
  ]),

  # ── Làm đẹp ────────────────────────────────────────────────────────────
  ("sub-cosmetics", "cat-beauty", [
    "son môi", "son kem", "phấn má", "phấn nền", "kem bb",
    "kem cc", "kem dưỡng da", "serum ", "skincare", "mỹ phẩm",
    "nước hoa ", "mascara", "phấn mắt", "kẻ mắt", "kẻ chân mày",
    "dưỡng ẩm", "sữa tắm", "dầu gội", "kem chống nắng",
    "tẩy trang", "nước tẩy trang", "toner ", "xịt khoáng",
    "miếng dán mí", "băng keo mí", "kẹp mi", "mi giả",
    "miếng dán nhấn mí", "hình xăm miếng",
    "xi đánh giày", "xi nước đánh bóng",  # chăm sóc giày
  ]),

  # ── Thú cưng ───────────────────────────────────────────────────────────
  ("sub-pet", "cat-others", [
    "thức ăn cho chó", "thức ăn cho mèo", "hạt cho chó", "hạt cho mèo",
    "lồng chó", "lồng mèo", "vòng cổ chó", "dây dắt chó",
    "phụ kiện thú cưng", "đồ chơi cho chó", "đồ chơi cho mèo",
    "nhà cho mèo", "cát vệ sinh mèo", "thú cưng", "cho mèo", "cho chó",
  ]),

  # ── Sách (bổ sung để bắt truyện không có chữ "sách") ───────────────────
  ("sub-books", "cat-books", [
    "ngụ ngôn", "truyện hay viết cho", "thiếu nhi",
    "kudo shinichi", "conan tập", "trần hoài dương",
    "những truyện hay",
  ]),

  # ── Thể thao (bổ sung cho unmatched) ───────────────────────────────────
  ("sub-fitness", "cat-sports", [
    "kính bơi", "quần chạy bộ", "vớ chạy bộ", "tất chạy bộ",
    "quần bơi", "áo bơi", "mũ bơi", "kính lặn",
    "bình nhiên liệu mini", "namilux",  # phụ kiện cắm trại
    "powerband", "đại nam sport", "đồ thể thao",
    "pickleball", "bình xịt vệ sinh vợt",
  ]),

  # ── Làm đẹp (bổ sung) ──────────────────────────────────────────────────
  ("sub-cosmetics", "cat-beauty", [
    "khẩu trang chống nắng", "khẩu trang chống nám",
    "khăn lau kính", "máy làm sạch kính", "dây đeo kính",
    "miếng dán chân ngải", "miếng dán kích mí", "vacosi",
    "basicare ", "dán mi ", "kích mí", "miraculous",
  ]),

  # ── Phụ kiện điện thoại / máy tính ────────────────────────────────────
  ("sub-phone", "cat-electronics", [
    "củ sạc", "sạc nhanh", "pin sạc dự phòng", "cáp sạc",
    "tai nghe bluetooth", "tai nghe không dây", "ốp lưng",
    "kính cường lực", "phụ kiện điện thoại",
  ]),
  ("sub-laptop", "cat-electronics", [
    "usb ", "flash drive", "cáp mạng", "dây mạng lan",
    "switch mạng", "tp-link", "router ", "hub usb",
    "miếng dán phím", "bàn phím cơ", "bàn phím bluetooth",
    "chuột không dây", "chuột gaming", "webcam ",
    "loa bluetooth", "loa vi tính", "tai nghe gaming",
    "pin laptop", "adapter laptop", "đế tản nhiệt",
  ]),
]

# Compile patterns
_RULE_RES: list[tuple[str, str, re.Pattern]] = [
  (sub, cat, re.compile("|".join(re.escape(kw) for kw in kws), re.IGNORECASE))
  for sub, cat, kws in CATEGORY_RULES
]


def product_text(product: dict) -> str:
  """Gộp tên + mô tả ngắn để phân loại chính xác hơn."""
  name = product.get("name", "")
  desc = (product.get("description") or "")[:300]
  return f"{name} {desc}".strip()


def classify(name: str) -> tuple[str, str] | None:
  """Trả về (sub_cat_id, cat_id) hoặc None nếu không match."""
  for sub_cat, cat, pattern in _RULE_RES:
    if pattern.search(name):
      return sub_cat, cat
  return None


def classify_product(product: dict) -> tuple[str, str] | None:
  """Ưu tiên tên sản phẩm; chỉ dùng mô tả khi tên không match."""
  name = product.get("name", "")
  by_name = classify(name)
  if by_name is not None:
    return by_name
  return classify(product_text(product))


def apply_category_fix(
  products: list[dict],
  *,
  strict: bool = True,
) -> tuple[list[dict], dict[str, int | list[str]]]:
  """Lọc junk, gán lại sub-category. strict=True: bỏ tin không match rule."""
  kept: list[dict] = []
  removed_junk = 0
  removed_unmatched = 0
  removed_invalid = 0
  reclassified = 0
  unmatched: list[str] = []

  for p in products:
    text = product_text(p)
    if should_remove(text):
      removed_junk += 1
      continue

    result = classify_product(p)
    if result is None:
      if strict:
        # Giữ category từ crawl/remap nếu hợp lệ trong registry
        if is_valid_sub_category(p.get("primarySubCategoryId", "")) and normalize_product_categories(p):
          kept.append(p)
          continue
        removed_unmatched += 1
        unmatched.append(p.get("name", ""))
        continue
      if not normalize_product_categories(p):
        removed_invalid += 1
        continue
      kept.append(p)
      continue

    sub_cat, cat = result
    if not is_valid_sub_category(sub_cat):
      removed_invalid += 1
      continue

    if p.get("primarySubCategoryId", "") != sub_cat:
      reclassified += 1

    p["primarySubCategoryId"] = sub_cat
    p["subCategoryIds"] = [sub_cat]
    p["categoryId"] = SUB_TO_PARENT.get(sub_cat, cat)
    if not normalize_product_categories(p):
      removed_invalid += 1
      continue
    kept.append(p)

  stats: dict[str, int | list[str]] = {
    "input": len(products),
    "removed_junk": removed_junk,
    "removed_unmatched": removed_unmatched,
    "removed_invalid": removed_invalid,
    "reclassified": reclassified,
    "unmatched": len(unmatched),
    "remaining": len(kept),
    "unmatched_samples": unmatched[:15],
  }
  return kept, stats


def log_stats(stats: dict[str, int | list[str]], kept: list[dict]) -> None:
  log.info("Removed (junk/food/voucher): %d", stats["removed_junk"])
  if stats.get("removed_unmatched"):
    log.info("Removed (no category match): %d", stats["removed_unmatched"])
  if stats.get("removed_invalid"):
    log.info("Removed (invalid sub-category): %d", stats["removed_invalid"])
  log.info("Re-classified category: %d", stats["reclassified"])
  log.info("Remaining: %d products", stats["remaining"])

  cat_counts = Counter(p["primarySubCategoryId"] for p in kept)
  log.info("\n=== Category distribution after fix ===")
  for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
    log.info("  %-35s: %d", cat, count)

  samples = stats.get("unmatched_samples") or []
  if samples:
    log.info("\n=== %d products with NO MATCH (15 examples) ===", stats["unmatched"])
    for name in samples:
      log.info("  ? %s", str(name)[:90])


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main() -> None:
  with open(INPUT_FILE, encoding="utf-8") as f:
    products: list[dict] = json.load(f)

  log.info("Loaded %d products from %s", len(products), INPUT_FILE)
  kept, stats = apply_category_fix(products)
  log_stats(stats, kept)

  with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(kept, f, ensure_ascii=False, indent=2)

  log.info("\n✅ Saved %d products → %s", len(kept), OUTPUT_FILE)


if __name__ == "__main__":
  main()
