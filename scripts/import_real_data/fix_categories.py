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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

INPUT_FILE  = Path(__file__).parent / "data" / "raw_products.json"
OUTPUT_FILE = Path(__file__).parent / "data" / "raw_products.json"  # overwrite in-place

# ──────────────────────────────────────────────────────────────────────────────
# 1. REMOVE rules – products matching any keyword are dropped
# ──────────────────────────────────────────────────────────────────────────────
REMOVE_PATTERNS = [
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
  # ── Electronics ────────────────────────────────────────────────────────
  ("sub-phone", "cat-electronics", [
    "điện thoại", "iphone", "redmi ", "oppo ", "realme ", "vivo ",
    "huawei ", "samsung galaxy", "nokia ", "motorola ",
  ]),
  ("sub-laptop", "cat-electronics", [
    "laptop", "macbook", "máy tính xách tay", "notebook ",
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

  # ── Thời trang – Giày trước (tránh bị khớp với túi xách) ──────────────
  ("sub-shoes", "cat-fashion", [
    "giày cao gót", "giày thể thao", "giày da nam", "giày da nữ",
    "giày lười", "giày bệt", "giày búp bê", "giày sneaker",
    "giày ", "dép eva", "dép quai hậu", "dép quai kẹp",
    "sandal ", "dép nam", "dép nữ", "boot ", "guốc ",
  ]),
  ("sub-bag", "cat-fashion", [
    "túi xách", "balo ", "ba lô ", "ví da ", "clutch ", "tote bag",
    "vali ", "hành lý", "túi đeo",
    # phụ kiện thời trang
    "thắt lưng", "dây lưng", "nón tai bèo", "nón lưỡi trai",
    "mũ chống nắng", "kẹp tóc", "cặp tóc", "cài tóc",
    "găng tay chống nắng", "găng tay lái xe",
    "khăn choàng", "khăn len",
    # túi laptop → bag
    "túi chống sốc", "bao chống sốc macbook", "túi đựng laptop",
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
    # Nếu tên chứa "nam" và là quần áo
    "quần thể thao nam", "bộ đồ nam",
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
  ("sub-pet-supplies", "cat-pets", [
    "thức ăn cho chó", "thức ăn cho mèo", "hạt cho chó", "hạt cho mèo",
    "lồng chó", "lồng mèo", "vòng cổ chó", "dây dắt chó",
    "phụ kiện thú cưng", "đồ chơi cho chó", "đồ chơi cho mèo",
    "nhà cho mèo", "cát vệ sinh mèo",
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

  # ── Xe ──────────────────────────────────────────────────────────────────
  ("sub-bike", "cat-vehicle", [
    "xe đạp", "xe điện", "xe đẩy đạp", "bicycle",
  ]),
  ("sub-motorcycle", "cat-vehicle", [
    "xe máy", "xe moto", "scooter", "xe ga ", "xe côn ",
  ]),
  ("sub-car", "cat-vehicle", [
    "ô tô", "xe hơi", "xe tải", "xe suv",
  ]),
]

# Compile patterns
_RULE_RES: list[tuple[str, str, re.Pattern]] = [
  (sub, cat, re.compile("|".join(re.escape(kw) for kw in kws), re.IGNORECASE))
  for sub, cat, kws in CATEGORY_RULES
]


def classify(name: str) -> tuple[str, str] | None:
  """Trả về (sub_cat_id, cat_id) hoặc None nếu không match."""
  for sub_cat, cat, pattern in _RULE_RES:
    if pattern.search(name):
      return sub_cat, cat
  return None


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main() -> None:
  with open(INPUT_FILE, encoding="utf-8") as f:
    products: list[dict] = json.load(f)

  log.info("Loaded %d products from %s", len(products), INPUT_FILE)

  kept: list[dict] = []
  removed_junk = 0
  reclassified = 0
  unmatched: list[str] = []

  for p in products:
    name = p.get("name", "")

    # Step 1: remove non-product items
    if should_remove(name):
      removed_junk += 1
      continue

    # Bước 2: Re-classify
    result = classify(name)
    if result is None:
      # No rule match → keep existing category (may already be correct)
      unmatched.append(name)
      kept.append(p)
      continue

    sub_cat, cat = result
    old_sub = p.get("primarySubCategoryId", "")
    if old_sub != sub_cat:
      reclassified += 1

    p["primarySubCategoryId"] = sub_cat
    p["subCategoryIds"] = [sub_cat]
    p["categoryId"] = cat
    kept.append(p)

  # Stats
  log.info("Removed (junk/food/voucher): %d", removed_junk)
  log.info("Re-classified category: %d", reclassified)
  log.info("No rule match (kept as-is): %d", len(unmatched))
  log.info("Remaining: %d products", len(kept))

  # Category distribution sau fix
  cat_counts = Counter(p["primarySubCategoryId"] for p in kept)
  log.info("\n=== Category distribution after fix ===")
  for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
    log.info("  %-35s: %d", cat, count)

  if unmatched:
    log.info("\n=== %d products with NO MATCH (15 examples) ===", len(unmatched))
    for name in unmatched[:15]:
      log.info("  ? %s", name[:90])

  # Lưu file
  with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(kept, f, ensure_ascii=False, indent=2)

  log.info("\n✅ Saved %d products → %s", len(kept), OUTPUT_FILE)


if __name__ == "__main__":
  main()
