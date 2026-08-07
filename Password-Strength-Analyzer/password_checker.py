"""
Password analysis: requirement checks, weak-pattern detection and scoring.

Scoring model (max 100):
    Length score        -> 30 points
    Character diversity -> 25 points
    Entropy             -> 45 points
    Pattern penalties   -> subtracted
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Callable, TypedDict

from entropy import calculate_entropy, entropy_label, estimate_crack_time
from utils import (
    longest_repeat,
    longest_repeated_block,
    longest_sequence,
    normalize,
)

MIN_LENGTH = 8


class Rule(TypedDict):
    key: str
    label: str
    suggestion: str
    test: Callable[[str], bool]


# The five baseline requirements shown in the UI checklist.
RULES: list[Rule] = [
    {
        "key": "length",
        "label": f"Minimum {MIN_LENGTH} characters",
        "suggestion": f"Increase password length to at least {MIN_LENGTH} characters.",
        "test": lambda pw: len(pw) >= MIN_LENGTH,
    },
    {
        "key": "uppercase",
        "label": "Uppercase letter (A-Z)",
        "suggestion": "Add uppercase letters.",
        "test": lambda pw: bool(re.search(r"[A-Z]", pw)),
    },
    {
        "key": "lowercase",
        "label": "Lowercase letter (a-z)",
        "suggestion": "Add lowercase letters.",
        "test": lambda pw: bool(re.search(r"[a-z]", pw)),
    },
    {
        "key": "number",
        "label": "Number (0-9)",
        "suggestion": "Add numbers.",
        "test": lambda pw: bool(re.search(r"[0-9]", pw)),
    },
    {
        "key": "special",
        "label": "Special character (!@#$...)",
        "suggestion": "Add a special character such as ! @ # $ % &.",
        "test": lambda pw: bool(re.search(r"[^A-Za-z0-9]", pw)),
    },
]

# A small embedded list of the most frequently breached passwords.
COMMON_PASSWORDS: frozenset[str] = frozenset(
    {
        "123456", "123456789", "12345678", "12345", "1234567", "1234567890",
        "password", "password1", "passw0rd", "qwerty", "qwerty123", "abc123",
        "111111", "000000", "iloveyou", "admin", "administrator", "welcome",
        "monkey", "dragon", "letmein", "football", "baseball", "sunshine",
        "princess", "master", "shadow", "superman", "trustno1", "hello",
        "freedom", "whatever", "starwars", "login", "solo", "test", "guest",
        "root", "toor", "pass", "secret", "hunter2", "zaq12wsx", "asdfgh",
    }
)

DICTIONARY_WORDS: tuple[str, ...] = (
    "password", "welcome", "admin", "login", "user", "secret", "money",
    "love", "hello", "summer", "winter", "spring", "autumn", "january",
    "monday", "friday", "google", "facebook", "amazon", "apple", "android",
    "dragon", "monkey", "shadow", "master", "princess", "football",
    "baseball", "sunshine", "computer", "internet", "server", "database",
    "india", "china", "london", "newyork", "school", "college", "student",
)

KEYBOARD_PATTERNS: tuple[str, ...] = (
    "qwerty", "qwertyuiop", "asdf", "asdfgh", "asdfghjkl", "zxcv", "zxcvbn",
    "qazwsx", "1qaz2wsx", "poiuy", "lkjh", "mnbv", "1q2w3e", "qweasd",
)


def detect_weaknesses(password: str) -> list[dict]:
    """Return every weak pattern found, with its penalty and a fix suggestion."""
    weaknesses: list[dict] = []
    lower = password.lower()
    normalized = normalize(password)

    if lower in COMMON_PASSWORDS or normalized in COMMON_PASSWORDS:
        weaknesses.append(
            {
                "id": "common",
                "message": "This is one of the most commonly breached passwords.",
                "penalty": 45,
                "suggestion": "Choose something unique — avoid passwords from breach lists.",
            }
        )
    else:
        word = next(
            (w for w in DICTIONARY_WORDS if len(w) >= 4 and w in normalized), None
        )
        if word:
            weaknesses.append(
                {
                    "id": "dictionary",
                    "message": f'This password contains the common dictionary word "{word}".',
                    "penalty": 15,
                    "suggestion": "Avoid common words; use an unrelated passphrase instead.",
                }
            )

    keyboard = next(
        (p for p in KEYBOARD_PATTERNS if p in lower or p[::-1] in lower), None
    )
    if keyboard:
        weaknesses.append(
            {
                "id": "keyboard",
                "message": "This password contains a common keyboard pattern.",
                "penalty": 18,
                "suggestion": "Avoid keyboard runs such as qwerty or asdf.",
            }
        )

    repeat = longest_repeat(password)
    if repeat >= 3:
        weaknesses.append(
            {
                "id": "repeat",
                "message": f"A single character repeats {repeat} times in a row.",
                "penalty": min(6 * (repeat - 2), 20),
                "suggestion": "Avoid repeating the same character several times.",
            }
        )

    sequence = longest_sequence(password)
    if sequence >= 4:
        weaknesses.append(
            {
                "id": "sequence",
                "message": (
                    f"This password contains a {sequence}-character sequence "
                    "such as 1234 or abcd."
                ),
                "penalty": min(6 * (sequence - 3), 20),
                "suggestion": "Avoid sequential numbers or letters.",
            }
        )

    block = longest_repeated_block(password)
    if block >= 3:
        weaknesses.append(
            {
                "id": "block",
                "message": f"A {block}-character sequence is repeated inside the password.",
                "penalty": min(4 * block, 16),
                "suggestion": "Avoid repeating the same chunk of characters.",
            }
        )

    return weaknesses


def _length_score(length: int) -> int:
    """Up to 30 points, saturating around 20 characters."""
    return 0 if length == 0 else min(30, round(length / 20 * 30))


def _diversity_score(checks: dict[str, bool]) -> int:
    """Up to 25 points shared across the four character families."""
    families = sum(
        1 for key in ("uppercase", "lowercase", "number", "special") if checks[key]
    )
    return round(families / 4 * 25)


def _entropy_score(bits: float) -> int:
    """Up to 45 points, saturating at 80 bits."""
    return min(45, round(bits / 80 * 45))


def strength_from_score(score: int) -> str:
    """Map a 0-100 score to Weak / Medium / Good / Strong."""
    if score <= 39:
        return "Weak"
    if score <= 59:
        return "Medium"
    if score <= 79:
        return "Good"
    return "Strong"


def analyze_password(password: str) -> dict:
    """Run the full analysis and return a JSON-serializable report."""
    checks = {rule["key"]: rule["test"](password) for rule in RULES}
    labels = {rule["key"]: rule["label"] for rule in RULES}

    bits = calculate_entropy(password)
    weaknesses = detect_weaknesses(password)
    penalty = sum(item["penalty"] for item in weaknesses)

    raw = _length_score(len(password)) + _diversity_score(checks) + _entropy_score(bits)
    score = max(0, min(100, raw - penalty))

    failed = [rule for rule in RULES if not checks[rule["key"]]]

    # Only relevant suggestions: unmet rules first, then pattern fixes.
    suggestions = [rule["suggestion"] for rule in failed]
    suggestions += [item["suggestion"] for item in weaknesses]
    if 0 < len(password) < 12:
        suggestions.append("Use 12+ characters — length matters more than complexity.")
    if not suggestions:
        suggestions.append(
            "Excellent password. Store it in a password manager and never reuse it."
        )

    return {
        "score": score,
        "strength": strength_from_score(score),
        "entropy": bits,
        "entropy_label": entropy_label(bits),
        "crack_time": estimate_crack_time(bits),
        "checks": checks,
        "labels": labels,
        "missing": [rule["label"] for rule in failed],
        "warnings": [item["message"] for item in weaknesses],
        "suggestions": list(dict.fromkeys(suggestions)),  # de-duplicate, keep order
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
