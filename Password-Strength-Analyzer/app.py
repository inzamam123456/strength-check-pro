"""
Password Strength Analyzer — Flask application.

Routes:
    GET  /          -> homepage
    POST /analyze   -> analyze a password
    POST /generate  -> generate a secure password
    GET  /health    -> health check for Render

Run locally:
    pip install -r requirements.txt
    python app.py

Production:
    gunicorn app:app
"""

from __future__ import annotations

import logging
import os

from flask import Flask, jsonify, render_template, request

from generator import MAX_GENERATED_LENGTH, MIN_GENERATED_LENGTH, generate_password
from password_checker import analyze_password
from utils import json_error, validate_password

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Environment variable support (see .env.example).
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", os.urandom(24).hex())
app.config["JSON_SORT_KEYS"] = False
DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"


@app.route("/")
def home():
    """Serve the homepage."""
    return render_template("index.html")


@app.post("/analyze")
def analyze():
    """Analyze a password. Body: {"password": "..."}"""
    payload = request.get_json(silent=True) or {}
    try:
        password = validate_password(payload.get("password"))
    except ValueError as exc:
        return json_error(str(exc))

    try:
        return jsonify(analyze_password(password))
    except Exception:  # pragma: no cover - defensive
        app.logger.exception("Password analysis failed")
        return json_error("Analysis failed. Please try again.", 500)


@app.post("/generate")
def generate():
    """
    Generate a secure password.

    Body: {"length": 16, "uppercase": true, "lowercase": true,
           "numbers": true, "symbols": true}
    """
    payload = request.get_json(silent=True) or {}

    try:
        length = int(payload.get("length", 16))
    except (TypeError, ValueError):
        return json_error(
            f"Length must be a number between {MIN_GENERATED_LENGTH} and {MAX_GENERATED_LENGTH}."
        )

    try:
        password = generate_password(
            length=length,
            uppercase=bool(payload.get("uppercase", True)),
            lowercase=bool(payload.get("lowercase", True)),
            numbers=bool(payload.get("numbers", True)),
            symbols=bool(payload.get("symbols", True)),
        )
    except ValueError as exc:
        return json_error(str(exc))

    # Return the analysis too so the UI can update in a single round trip.
    return jsonify({"password": password, "analysis": analyze_password(password)})


@app.get("/health")
def health():
    """Simple health check endpoint."""
    return jsonify({"status": "ok"})


@app.errorhandler(404)
def not_found(_error):
    return json_error("Not found.", 404)


if __name__ == "__main__":
    # Render provides the PORT environment variable.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
