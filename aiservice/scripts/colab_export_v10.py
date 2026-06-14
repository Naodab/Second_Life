"""
Export model v10 từ Colab → dùng cho Flask API (aiservice).

CHẠY TRONG CÙNG SESSION SAU KHI TRAIN XONG (không restart runtime).

Cách 1 — paste EXPORT_CELL vào notebook cell mới (sau cell training).
Cách 2 — upload file này lên Colab rồi %run colab_export_v10.py
"""

from __future__ import annotations

EXPORT_CELL = r'''
# ============================================================
# EXPORT v10 cho Flask API — chạy NGAY SAU training, KHÔNG restart runtime
# ============================================================
import json
import os
import shutil

import joblib
import numpy as np
import pandas as pd

# --- đổi đường dẫn nếu cần ---
OUTPUT_DIR = "/content/drive/MyDrive/phone_price_model_v10_chotot"
API_DIR_NAME = "v10_for_api"   # folder copy sang aiservice/models/v10/

os.makedirs(OUTPUT_DIR, exist_ok=True)
api_dir = os.path.join(OUTPUT_DIR, API_DIR_NAME)
if os.path.exists(api_dir):
    shutil.rmtree(api_dir)
os.makedirs(api_dir, exist_ok=True)

# --- kiểm tra biến bắt buộc từ notebook ---
_required = [
    "best_pipe", "best_name", "encoders", "ALL_FEATURES",
    "TE_COLS", "NUM_COLS", "CHIP_GEN_MAP", "POSITIVE_KW", "DEFECT_KW",
    "brand_chip_median", "global_chip_median", "age_median",
    "df_clean", "y_train", "results_v10", "PRICE_MIN", "PRICE_MAX",
]
_missing = [n for n in _required if n not in globals()]
if _missing:
    raise RuntimeError(
        "Thiếu biến sau khi train — chạy lại các cell training trước:\n  "
        + ", ".join(_missing)
    )

pre = best_pipe.named_steps["pre"]
mdl = best_pipe.named_steps["model"]
booster = mdl.get_booster()

def _parse_xgb_base_score(raw):
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

# --- lấy base_score thật từ model đã fit ---
_cfg = json.loads(booster.save_config())
base_score_trained = _parse_xgb_base_score(_cfg["learner"]["learner_model_param"]["base_score"])
log_price_mean = float(y_train.mean())

print(f"base_score (trained): {base_score_trained:.4f}")
print(f"log_price_mean      : {log_price_mean:.4f}")

# --- smoke test TRƯỚC export (phải ra vài triệu, không phải ~250k) ---
def _safe_enc(le, val):
    v = str(val)
    return le.transform([v])[0] if v in le.classes_ else le.transform([le.classes_[0]])[0]

def _predict_price_v10_check(model_name, brand, ram_gb, storage_gb, sl_condition,
                             age_years, color="__NA__", screen_inches=None,
                             origin_code=0, warranty_code=0, region="Khác",
                             sim_lock="Unknown", num_images=5, has_video=0, title=""):
    COND_MAP = {"Like New": 3, "Good": 2, "Fair": 1}
    cond = COND_MAP.get(sl_condition, 1)
    scr = screen_inches if screen_inches else float(df_clean["screen_inches"].median())
    chip = extract_chip_gen(None, model_name)
    if pd.isna(chip):
        chip = brand_chip_median.get(brand, global_chip_median)
    t = str(title).lower()
    q = sum(k in t for k in POSITIVE_KW)
    d = sum(k in t for k in DEFECT_KW)
    bat = extract_battery(t)
    row = {
        "model": str(model_name).lower().strip(),
        "color": str(color).lower().strip(),
        "brand_enc": _safe_enc(encoders["brand"], brand),
        "sl_condition_enc": _safe_enc(encoders["sl_condition"], sl_condition),
        "region_group_enc": _safe_enc(encoders["region_group"], region),
        "sim_lock_enc": _safe_enc(encoders["sim_lock"], sim_lock),
        "ram_gb": ram_gb,
        "storage_gb": storage_gb,
        "screen_inches": scr,
        "condition_score": cond,
        "age_years": age_years,
        "is_age_known": 1,
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
        "has_battery_info": int(pd.notna(bat)),
        "battery_pct": bat,
    }
    x_in = pd.DataFrame([row])[ALL_FEATURES]
    pred_log = best_pipe.predict(x_in)[0]
    pred_log = np.clip(pred_log, np.log1p(PRICE_MIN * 0.5), np.log1p(PRICE_MAX * 1.2))
    return int(round(np.expm1(pred_log)))

_check = _predict_price_v10_check(
    model_name="iPhone 13", brand="Apple", ram_gb=6, storage_gb=128,
    sl_condition="Good", age_years=2, origin_code=1, region="HCM",
    title="iphone 13 zin fullbox pin 92%",
)
print(f"Sanity iPhone 13 (in-session): {_check:,} VND")
if _check < 1_000_000:
    raise RuntimeError(
        "Model trong session đang predict sai (<1tr). "
        "Không export — hãy train lại hoặc kiểm tra pipeline."
    )

# ============================================================
# 1) Export native XGBoost + preprocessor (API dùng cái này)
# ============================================================
xgb_path = os.path.join(api_dir, "xgb_model.json")
pre_path = os.path.join(api_dir, "preprocessor.pkl")

# save_model qua booster — ổn định hơn pickle
booster.save_model(xgb_path)
joblib.dump(pre, pre_path)

# ============================================================
# 2) Label encoders + artifacts (kèm metadata cho API)
# ============================================================
artifacts_export = {
    "ALL_FEATURES": ALL_FEATURES,
    "TE_COLS": TE_COLS,
    "NUM_COLS": NUM_COLS,
    "CHIP_GEN_MAP": CHIP_GEN_MAP,
    "POSITIVE_KW": POSITIVE_KW,
    "DEFECT_KW": DEFECT_KW,
    "brand_chip_median": brand_chip_median.to_dict()
        if hasattr(brand_chip_median, "to_dict") else dict(brand_chip_median),
    "global_chip_median": float(global_chip_median),
    "age_median": float(age_median),
    "screen_median": float(df_clean["screen_inches"].median()),
    "PRICE_MIN": int(PRICE_MIN),
    "PRICE_MAX": int(PRICE_MAX),
    "log_price_mean": log_price_mean,
    "base_score_trained": base_score_trained,
    "best_model": best_name,
    "metrics": {
        k: v for k, v in results_v10[best_name].items()
        if k not in ("pipe", "pred_vnd")
    },
    "sanity_checks": {
        "iphone_13_good_vnd": _check,
    },
}

joblib.dump(encoders, os.path.join(api_dir, "label_encoders.pkl"))
with open(os.path.join(api_dir, "artifacts.json"), "w", encoding="utf-8") as f:
    json.dump(artifacts_export, f, ensure_ascii=False, indent=2)

# ============================================================
# 3) (Tuỳ chọn) Lưu full pipeline để archive — API KHÔNG cần file này
# ============================================================
safe = best_name.replace(" ", "_").replace("(", "").replace(")", "").lower()
archive_pipe = os.path.join(OUTPUT_DIR, f"pipeline_{safe}.pkl")
joblib.dump(best_pipe, archive_pipe)

# ============================================================
# 4) Verify sau export: load lại native và so sánh
# ============================================================
from xgboost import Booster

pre_reload = joblib.load(pre_path)
bst_reload = Booster()
bst_reload.load_model(xgb_path)

row = {
    "model": "iphone 13", "color": "__na__",
    "brand_enc": _safe_enc(encoders["brand"], "APPLE"),
    "sl_condition_enc": _safe_enc(encoders["sl_condition"], "Good"),
    "region_group_enc": _safe_enc(encoders["region_group"], "HCM"),
    "sim_lock_enc": _safe_enc(encoders["sim_lock"], "Unknown"),
    "ram_gb": 6, "storage_gb": 128, "screen_inches": float(df_clean["screen_inches"].median()),
    "condition_score": 2, "age_years": 2, "is_age_known": 1,
    "chip_gen": 4.0, "chip_x_age": 4.0 / 3,
    "origin_code": 1, "is_official": 1,
    "warranty_code": 0, "has_warranty": 0,
    "spec_score": 6 * np.log1p(128),
    "depreciation_score": 2 * (1 - 2 / 3),
    "num_images": 5, "has_video": 0,
    "title_quality_score": 2, "title_defect_score": 0,
    "has_battery_info": 1, "battery_pct": 92.0,
}
x_df = pd.DataFrame([row])[ALL_FEATURES]
feat_names = list(pre_reload.get_feature_names_out())
x_enc = pre_reload.transform(x_df)

import xgboost as xgb
dm = xgb.DMatrix(x_enc, feature_names=feat_names)
pred_reload_log = float(bst_reload.predict(dm)[0])

_cfg2 = json.loads(bst_reload.save_config())
base_score_exported = _parse_xgb_base_score(_cfg2["learner"]["learner_model_param"]["base_score"])
offset = log_price_mean - base_score_exported if base_score_exported < 2.0 else 0.0
pred_reload_vnd = int(round(np.expm1(pred_reload_log + offset)))

print(f"base_score (exported json): {base_score_exported:.4f}")
print(f"log offset for API       : {offset:.4f}")
print(f"Reload iPhone 13         : {pred_reload_vnd:,} VND")
if pred_reload_vnd < 1_000_000:
    print("⚠️  Cảnh báo: file export reload ra giá thấp.")
    print("    API sẽ dùng log_price_mean để hiệu chỉnh — vẫn copy được.")

# ============================================================
# 5) Tóm tắt — copy folder api_dir → máy local
# ============================================================
print("\n✅ Export xong!")
print("Copy folder này vào máy local:")
print(f"   {api_dir}")
print("   → aiservice/models/v10/")
print("\nFiles cần có:")
for fn in sorted(os.listdir(api_dir)):
    fp = os.path.join(api_dir, fn)
    print(f"   - {fn} ({os.path.getsize(fp)/1024:.1f} KB)")
print(f"\n(Archive) pipeline pickle: {archive_pipe}")
'''

if __name__ == "__main__":
    print("=" * 60)
    print("PASTE đoạn code dưới vào 1 cell Colab mới (sau cell training):")
    print("=" * 60)
    print(EXPORT_CELL)
