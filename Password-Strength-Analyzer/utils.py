"""Shared helpers: JSON responses, validation and pattern utilities."""

from __future__ import annotations

from typing import Any

from flask import jsonify

MAX_PASSWORD_LENGTH = 256

# Common "leet" substitutions, used to normalize before dictionary matching.
LEET_MAP = str.maketrans(
    {"@": "a", "4": "a", "0": "o", "1": "l", "!": "l", "|": "l", "3": "e", "5": "s", "$": "s", "7": "t"}
)


def json_error(message: str, status: int = 400):
    """Return a consistent JSON error response."""
    return jsonify({"error": message}), status


def validate_password(value: Any) -> str:
    """
    Validate an incoming password payload value.

    Raises:
        ValueError: if the value is missing, not a string, or too long.
    """
    if not isinstance(value, str) or value == "":
        raise ValueError("Please enter a password.")
    if len(value) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password must be {MAX_PASSWORD_LENGTH} characters or fewer.")
    return value


def normalize(password: str) -> str:
    """Lowercase the password and undo common leet substitutions."""
    return password.lower().translate(LEET_MAP)


def longest_repeat(password: str) -> int:
    """Longest run of the same repeated character, e.g. 'aaaa' -> 4."""
    best = run = 0
    previous = ""
    for char in password:
        run = run + 1 if char == previous else 1
        previous = char
        best = max(best, run)
    return best


def longest_sequence(password: str) -> int:
    """Longest ascending or descending character run, e.g. 'abcd' / '4321'."""
    lower = password.lower()
    if not lower:
        return 0

    best = asc = desc = 1
    for i in range(1, len(lower)):
        diff = ord(lower[i]) - ord(lower[i - 1])
        asc = asc + 1 if diff == 1 else 1
        desc = desc + 1 if diff == -1 else 1
        best = max(best, asc, desc)
    return best


def longest_repeated_block(password: str) -> int:
    """Length of the longest repeated substring of 3+ characters."""
    n = len(password)
    for size in range(n // 2, 2, -1):
        seen: set[str] = set()
        for i in range(n - size + 1):
            chunk = password[i : i + size]
            if chunk in seen:
                return size
            seen.add(chunk)
    return 0
