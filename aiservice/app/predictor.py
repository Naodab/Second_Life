"""Load v10 artifacts and run phone price inference."""

from __future__ import annotations

import json
from glob import glob
from pathlib import Path
from typing import Any, Callable, Optional

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

from .config import MODEL_DIR, SUB_PHONE
from .features import (
    build_feature_row,
    log_to_vnd,
    merge_text,
    normalize_brand,
    normalize_region,
    parse_storage_gb,
    parse_xgb_base_score,
    round_ram,
    compute_age_years,
)


class ModelNotReadyError(RuntimeError):
    pass


class UnsupportedCategoryError(ValueError):
    pass


class PhonePricePredictor:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = Path(model_dir)
        self.pipeline = None
        self.preprocessor = None
        self.booster: Optional[xgb.Booster] = None
        self._feature_names: list[str] = []
        self._log_offset: float = 0.0
        self._predict_fn: Optional[Callable[[pd.DataFrame], float]] = None
        self.encoders: dict = {}
        self.artifacts: dict = {}
        self.all_features: list[str] = []
        self._ready = False
        self._load_mode = ""

    @property
    def is_ready(self) -> bool:
        return self._ready

    def load(self) -> None:
        encoders_path = self.model_dir / "label_encoders.pkl"
        artifacts_path = self.model_dir / "artifacts.json"

        if not encoders_path.exists() or not artifacts_path.exists():
            raise ModelNotReadyError(
                f"Missing model artifacts in {self.model_dir}. "
                "Expected label_encoders.pkl and artifacts.json"
            )

        self.encoders = joblib.load(encoders_path)
        with open(artifacts_path, encoding="utf-8") as f:
            self.artifacts = json.load(f)
        self.all_features = list(self.artifacts.get("ALL_FEATURES", []))

        native_xgb = self._resolve_native_xgb_path()
        preprocessor_path = self.model_dir / "preprocessor.pkl"
        if native_xgb and preprocessor_path.exists():
            self.preprocessor = joblib.load(preprocessor_path)
            self._feature_names = list(self.preprocessor.get_feature_names_out())
            self.booster = xgb.Booster()
            self.booster.load_model(str(native_xgb))
            self._log_offset = self._resolve_log_offset(self.booster)
            self._predict_fn = self._predict_native
            self._load_mode = "native"
        else:
            pipeline_path = self._resolve_pipeline_path()
            if not pipeline_path:
                raise ModelNotReadyError(
                    f"Missing model in {self.model_dir}. "
                    "Need pipeline_*.pkl OR (preprocessor.pkl + xgb_model.json)."
                )
            self.pipeline = joblib.load(pipeline_path)
            mdl = self.pipeline.named_steps["model"]
            self._log_offset = self._resolve_log_offset(mdl.get_booster())
            self._predict_fn = self._predict_pipeline
            self._load_mode = "pickle"

        self._validate_predictions()
        self._ready = True

    def _resolve_log_offset(self, booster: xgb.Booster) -> float:
        """Fix XGBoost exports where base_score resets to 0.5 after Colab deserialize."""
        try:
            cfg = json.loads(booster.save_config())
            base_score = parse_xgb_base_score(cfg["learner"]["learner_model_param"]["base_score"])
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            return 0.0
        if base_score >= 2.0:
            return 0.0
        log_price_mean = float(
            self.artifacts.get("log_price_mean")
            or self.artifacts.get("base_score_trained")
            or 15.587
        )
        return log_price_mean - base_score

    def _apply_log_offset(self, pred_log: float) -> float:
        return float(pred_log + self._log_offset)

    def _resolve_native_xgb_path(self) -> Optional[Path]:
        for name in ("xgb_model.json", "xgb_model.ubj"):
            path = self.model_dir / name
            if path.exists():
                return path
        return None

    def _predict_pipeline(self, x_in: pd.DataFrame) -> float:
        pre = self.pipeline.named_steps["pre"]
        mdl = self.pipeline.named_steps["model"]
        x_enc = pre.transform(x_in)
        dm = xgb.DMatrix(x_enc, feature_names=list(pre.get_feature_names_out()))
        return self._apply_log_offset(float(mdl.get_booster().predict(dm)[0]))

    def _predict_native(self, x_in: pd.DataFrame) -> float:
        x_enc = self.preprocessor.transform(x_in)
        dm = xgb.DMatrix(x_enc, feature_names=self._feature_names)
        return self._apply_log_offset(float(self.booster.predict(dm)[0]))

    def _validate_predictions(self) -> None:
        sample = self._build_sample_row()
        x_in = pd.DataFrame([sample])[self.all_features]
        suggested = log_to_vnd(self._predict_fn(x_in))
        if suggested < 1_000_000:
            raise ModelNotReadyError(
                "Model không hợp lệ (dự đoán quá thấp). "
                "Export lại từ Colab trong cùng session train: "
                "scripts/colab_export_v10.py"
            )

    def _build_sample_row(self) -> dict[str, Any]:
        return build_feature_row(
            model_name="iPhone 13",
            brand="APPLE",
            ram_gb=6,
            storage_gb=128,
            sl_condition="Good",
            age_years=2,
            is_age_known=1,
            color="__NA__",
            screen_inches=float(self.artifacts.get("screen_median", 6.67)),
            origin_code=1,
            warranty_code=0,
            region="HCM",
            sim_lock="Unknown",
            num_images=5,
            has_video=0,
            title="iphone 13 zin fullbox pin 92%",
            description="",
            encoders=self.encoders,
            brand_chip_median=self.artifacts.get("brand_chip_median", {}),
            global_chip_median=float(self.artifacts.get("global_chip_median", 3.0)),
        )

    def _resolve_pipeline_path(self) -> Optional[Path]:
        explicit = self.model_dir / "pipeline.pkl"
        if explicit.exists():
            return explicit
        matches = sorted(glob(str(self.model_dir / "pipeline_*.pkl")))
        return Path(matches[0]) if matches else None

    def ensure_sub_phone(self, sub_category_id: Optional[str], sub_category_ids: Optional[list[str]] = None) -> None:
        ids = set(sub_category_ids or [])
        if sub_category_id:
            ids.add(sub_category_id)
        if ids and SUB_PHONE not in ids:
            raise UnsupportedCategoryError(
                f"Chỉ hỗ trợ sub-category '{SUB_PHONE}'. Nhận được: {sorted(ids)}"
            )

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self._ready:
            raise ModelNotReadyError("Model chưa được load.")

        self.ensure_sub_phone(payload.get("subCategoryId"), payload.get("subCategoryIds"))

        listing_type = (payload.get("listingType") or "BUY").strip().upper()
        if listing_type != "BUY":
            raise ValueError("Mô hình v10 chỉ hỗ trợ định giá mua (listingType=BUY).")

        brand = (payload.get("brand") or "").strip()
        model_name = (payload.get("modelName") or payload.get("productName") or "").strip()
        if not brand or not model_name:
            raise ValueError("brand và modelName (hoặc productName) là bắt buộc.")

        ram_gb = round_ram(payload.get("ramGb"))
        storage_gb = parse_storage_gb(payload.get("storageGb") or payload.get("capacity"))
        if storage_gb is None:
            raise ValueError("storageGb (hoặc capacity) là bắt buộc.")

        title = payload.get("title") or payload.get("listingTitle") or payload.get("productName") or ""
        description = payload.get("description") or payload.get("listingDescription") or payload.get("productDescription") or ""

        age_years, is_age_known = compute_age_years(
            payload.get("manufactureYear"),
            title=title,
            description=description,
            age_median=float(self.artifacts.get("age_median", 2.0)),
        )

        screen_inches = payload.get("screenInches")
        if screen_inches is None:
            screen_inches = float(self.artifacts.get("screen_median", 6.5))
        screen_inches = float(screen_inches)
        if screen_inches < 3 or screen_inches > 8:
            screen_inches = float(self.artifacts.get("screen_median", 6.5))

        row = build_feature_row(
            model_name=model_name,
            brand=normalize_brand(brand),
            ram_gb=ram_gb,
            storage_gb=float(storage_gb),
            sl_condition=payload.get("condition") or "Good",
            age_years=age_years,
            is_age_known=is_age_known,
            color=payload.get("color") or "__NA__",
            screen_inches=screen_inches,
            origin_code=int(payload.get("originCode") or 0),
            warranty_code=int(payload.get("warrantyCode") or 0),
            region=normalize_region(payload.get("regionName")),
            sim_lock=payload.get("simLock") or "Unknown",
            num_images=float(min(30, max(0, payload.get("numImages") or 5))),
            has_video=float(1 if payload.get("hasVideo") else 0),
            title=title,
            description=description,
            encoders=self.encoders,
            brand_chip_median=self.artifacts.get("brand_chip_median", {}),
            global_chip_median=float(self.artifacts.get("global_chip_median", 3.0)),
        )

        x_in = pd.DataFrame([row])[self.all_features]
        pred_log = self._predict_fn(x_in)
        suggested = log_to_vnd(pred_log)

        confidence = self._confidence(payload, model_name, is_age_known)
        band = 0.18 if confidence == "HIGH" else 0.22 if confidence == "MEDIUM" else 0.28
        price_min = int(round(suggested * (1 - band), -3))
        price_max = int(round(suggested * (1 + band), -3))

        return {
            "subCategoryId": SUB_PHONE,
            "listingType": "BUY",
            "suggestedPriceVnd": suggested,
            "priceMinVnd": max(price_min, 0),
            "priceMaxVnd": price_max,
            "confidence": confidence,
            "reasoningBrief": self._reasoning(brand, model_name, payload.get("condition"), age_years, suggested),
            "modelVersion": "phone_price_v10",
            "bestModel": self.artifacts.get("best_model"),
            "loadMode": self._load_mode,
        }

    def _confidence(self, payload: dict[str, Any], model_name: str, is_age_known: int) -> str:
        has_specs = payload.get("ramGb") is not None and (
            payload.get("storageGb") is not None or payload.get("capacity") is not None
        )
        has_text = bool(merge_text(
            payload.get("title") or payload.get("listingTitle") or "",
            payload.get("description") or payload.get("listingDescription") or "",
        ))
        if has_specs and model_name and is_age_known:
            return "HIGH"
        if has_specs and model_name:
            return "MEDIUM"
        if has_text:
            return "MEDIUM"
        return "LOW"

    def _reasoning(self, brand: str, model_name: str, condition: Optional[str], age_years: float, price: int) -> str:
        cond = condition or "Good"
        return (
            f"Ước tính {price:,} ₫ cho {brand} {model_name} "
            f"({cond}, ~{age_years:.0f} năm) theo mô hình ML v10 trên dữ liệu Chợ Tốt."
        )
