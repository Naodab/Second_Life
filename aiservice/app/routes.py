from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from .config import SUB_PHONE
from .predictor import ModelNotReadyError, PhonePricePredictor, UnsupportedCategoryError

api = Blueprint("api", __name__)


def _predictor() -> PhonePricePredictor:
    return current_app.extensions["phone_predictor"]


@api.get("/health")
def health():
    predictor = _predictor()
    return jsonify({
        "status": "ok" if predictor.is_ready else "degraded",
        "service": "aiservice-phone-pricing",
        "supportedSubCategory": SUB_PHONE,
        "modelLoaded": predictor.is_ready,
        "modelDir": str(predictor.model_dir),
        "loadMode": getattr(predictor, "_load_mode", ""),
    })


@api.post("/api/v1/ai/suggest-price/phone")
def suggest_phone_price():
    payload = request.get_json(silent=True) or {}
    sub_id = payload.get("subCategoryId") or payload.get("primarySubCategoryId")
    sub_ids = list(payload.get("subCategoryIds") or [])

    if not sub_id and not sub_ids:
        sub_id = SUB_PHONE
        payload = {**payload, "subCategoryId": SUB_PHONE}

    if sub_id and sub_id != SUB_PHONE:
        return jsonify({
            "error": "unsupported_sub_category",
            "message": f"Endpoint này chỉ hỗ trợ sub-category '{SUB_PHONE}'.",
            "supportedSubCategory": SUB_PHONE,
        }), 400
    if sub_ids and SUB_PHONE not in sub_ids:
        return jsonify({
            "error": "unsupported_sub_category",
            "message": f"Endpoint này chỉ hỗ trợ sub-category '{SUB_PHONE}'.",
            "supportedSubCategory": SUB_PHONE,
        }), 400

    try:
        result = _predictor().predict(payload)
        return jsonify(result)
    except UnsupportedCategoryError as exc:
        return jsonify({"error": "unsupported_sub_category", "message": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"error": "invalid_request", "message": str(exc)}), 400
    except ModelNotReadyError as exc:
        return jsonify({"error": "model_not_ready", "message": str(exc)}), 503
    except Exception as exc:
        current_app.logger.exception("predict failed")
        return jsonify({"error": "internal_error", "message": str(exc)}), 500
