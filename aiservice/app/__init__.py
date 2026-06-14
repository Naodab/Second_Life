from flask import Flask

from .config import HOST, PORT
from .predictor import ModelNotReadyError, PhonePricePredictor
from .routes import api


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(api)

    predictor = PhonePricePredictor()
    try:
        predictor.load()
        app.logger.info("Phone price model v10 loaded from %s", predictor.model_dir)
    except ModelNotReadyError as exc:
        app.logger.warning("Phone price model not loaded: %s", exc)

    app.extensions["phone_predictor"] = predictor
    return app


def main() -> None:
    app = create_app()
    app.run(host=HOST, port=PORT, debug=False)


if __name__ == "__main__":
    main()
