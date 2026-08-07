"""Entropy estimation and crack-time modelling."""

from __future__ import annotations

import math
import re

# Guesses per second assumed for an offline attacker with modern GPUs.
GUESSES_PER_SECOND = 1e10

# (threshold_in_bits, label) evaluated in order.
ENTROPY_LABELS: list[tuple[float, str]] = [
    (28, "Very Weak"),
    (36, "Weak"),
    (60, "Reasonable"),
    (128, "Strong"),
    (math.inf, "Very Strong"),
]

# (divisor, next_unit_name)
_TIME_UNITS: list[tuple[int, str]] = [
    (60, "minute"),
    (60, "hour"),
    (24, "day"),
    (365, "year"),
    (100, "century"),
]


def charset_size(password: str) -> int:
    """Return the size of the character pool the password draws from."""
    size = 0
    if re.search(r"[a-z]", password):
        size += 26
    if re.search(r"[A-Z]", password):
        size += 26
    if re.search(r"[0-9]", password):
        size += 10
    if re.search(r"[ !-/:-@\[-`{-~]", password):
        size += 33
    if re.search(r"[^\x20-\x7e]", password):  # emoji, accents, etc.
        size += 100
    return size


def calculate_entropy(password: str) -> float:
    """Return entropy in bits: length * log2(charset size)."""
    size = charset_size(password)
    if not size or not password:
        return 0.0
    return round(len(password) * math.log2(size), 1)


def entropy_label(bits: float) -> str:
    """Return the qualitative label for an entropy value."""
    for threshold, label in ENTROPY_LABELS:
        if bits < threshold:
            return label
    return "Very Strong"


def _format_number(value: float) -> str:
    if value >= 1_000_000:
        return f"{value:.2e}".replace("e+", " x 10^")
    return f"{value:,.1f}".rstrip("0").rstrip(".")


def estimate_crack_time(bits: float) -> str:
    """Return a human readable crack time such as '142 years'."""
    if bits <= 0:
        return "instantly"

    # An average attacker needs to search half the keyspace.
    seconds = (2 ** min(bits, 1024)) / 2 / GUESSES_PER_SECOND
    if seconds < 1:
        return "instantly"

    value, unit = seconds, "second"
    for divisor, next_unit in _TIME_UNITS:
        if value < divisor:
            break
        value /= divisor
        unit = next_unit

    if unit == "century" and value >= 1_000_000:
        return "millions of centuries"

    value = round(value, 1) if value < 10 else round(value)
    plural = "" if value == 1 else "s"
    return f"{_format_number(value)} {unit}{plural}"
