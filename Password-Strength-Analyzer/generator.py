"""Cryptographically secure password generator."""

from __future__ import annotations

import secrets
import string

CHARSETS: dict[str, str] = {
    "uppercase": string.ascii_uppercase,
    "lowercase": string.ascii_lowercase,
    "numbers": string.digits,
    "symbols": "!@#$%^&*()-_=+[]{};:,.?/",
}

MIN_GENERATED_LENGTH = 8
MAX_GENERATED_LENGTH = 32


def generate_password(
    length: int = 16,
    uppercase: bool = True,
    lowercase: bool = True,
    numbers: bool = True,
    symbols: bool = True,
) -> str:
    """
    Generate a random password using the `secrets` module (CSPRNG).

    The result contains at least one character from every enabled pool and is
    shuffled so character positions are not predictable.

    Raises:
        ValueError: if no character type is selected.
    """
    selected = {
        "uppercase": uppercase,
        "lowercase": lowercase,
        "numbers": numbers,
        "symbols": symbols,
    }
    pools = [CHARSETS[name] for name, enabled in selected.items() if enabled]
    if not pools:
        raise ValueError("Select at least one character type.")

    length = max(MIN_GENERATED_LENGTH, min(int(length), MAX_GENERATED_LENGTH))
    length = max(length, len(pools))

    alphabet = "".join(pools)
    chars = [secrets.choice(pool) for pool in pools]
    chars += [secrets.choice(alphabet) for _ in range(length - len(chars))]

    # Secure Fisher-Yates shuffle.
    for i in range(len(chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        chars[i], chars[j] = chars[j], chars[i]

    return "".join(chars)
