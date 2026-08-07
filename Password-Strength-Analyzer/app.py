"""
Password Strength Analyzer - Flask backend.

Run locally:
    pip install -r requirements.txt
    python app.py

Production (Render):
    gunicorn app:app
"""

import os
import re

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Each satisfied rule is worth 20 points (5 rules x 20 = 100).
POINTS_PER_RULE = 20
MIN_LENGTH = 8


def analyze_password(password: str) -> dict:
    """Analyze a password and return score, strength, missing rules and tips."""

    # Each check maps a rule key to whether the password satisfies it.
    checks = {
        "length": len(password) >= MIN_LENGTH,
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "lowercase": bool(re.search(r"[a-z]", password)),
        "number": bool(re.search(r"[0-9]", password)),
        "special": bool(re.search(r"[^A-Za-z0-9]", password)),
    }

    # Human readable labels used for the checklist / missing requirements.
    labels = {
        "length": f"Minimum {MIN_LENGTH} characters",
        "uppercase": "Uppercase letter (A-Z)",
        "lowercase": "Lowercase letter (a-z)",
        "number": "Number (0-9)",
        "special": "Special character (!@#$...)",
    }

    # Suggestions shown when a rule is not satisfied.
    suggestions_map = {
        "length": f"Make your password at least {MIN_LENGTH} characters long.",
        "uppercase": "Add at least one uppercase letter.",
        "lowercase": "Add at least one lowercase letter.",
        "number": "Add at least one number.",
        "special": "Add a special character such as ! @ # $ % &.",
    }

    score = sum(POINTS_PER_RULE for passed in checks.values() if passed)

    if score <= 40:
        strength = "Weak"
    elif score <= 80:
        strength = "Medium"
    else:
        strength = "Strong"

    missing = [labels[key] for key, passed in checks.items() if not passed]
    suggestions = [suggestions_map[key] for key, passed in checks.items() if not passed]

    if not suggestions:
        suggestions.append("Great job! Consider using a passphrase of 16+ characters.")

    return {
        "score": score,
        "strength": strength,
        "checks": checks,
        "labels": labels,
        "missing": missing,
        "suggestions": suggestions,
    }


@app.route("/")
def home():
    """Serve the homepage."""
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    """Analyze a password sent as JSON: {"password": "..."}"""
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    if not isinstance(password, str) or password == "":
        return jsonify({"error": "Please enter a password."}), 400

    return jsonify(analyze_password(password))


if __name__ == "__main__":
    # Render provides the PORT environment variable.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
