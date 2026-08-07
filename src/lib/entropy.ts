/**
 * Entropy estimation and crack-time modelling.
 * Mirrors Password-Strength-Analyzer/entropy.py so the preview and the
 * Flask backend always agree on the numbers they report.
 */

/** Guesses per second assumed for an offline attacker with modern GPUs. */
export const GUESSES_PER_SECOND = 1e10;

export type EntropyLabel =
  | "Very Weak"
  | "Weak"
  | "Reasonable"
  | "Strong"
  | "Very Strong";

/** Size of the character pool the password draws from. */
export function charsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[ !-/:-@[-`{-~]/.test(password)) size += 33;
  // Anything outside printable ASCII (emoji, accents, ...).
  if (/[^\x20-\x7e]/.test(password)) size += 100;
  return size;
}

/** Shannon-style entropy: log2(charset ^ length), rounded to 1 decimal. */
export function calculateEntropy(password: string): number {
  const size = charsetSize(password);
  if (!size || !password.length) return 0;
  return Math.round(password.length * Math.log2(size) * 10) / 10;
}

/** Qualitative label for a given entropy value. */
export function entropyLabel(bits: number): EntropyLabel {
  if (bits < 28) return "Very Weak";
  if (bits < 36) return "Weak";
  if (bits < 60) return "Reasonable";
  if (bits < 128) return "Strong";
  return "Very Strong";
}

const TIME_UNITS: [number, string][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [365, "day"],
  [100, "year"],
];

/** Human readable crack time, e.g. "142 years" or "instantly". */
export function estimateCrackTime(bits: number): string {
  if (bits <= 0) return "instantly";

  // Average attacker needs half the keyspace.
  const seconds = Math.pow(2, Math.min(bits, 1024)) / 2 / GUESSES_PER_SECOND;

  if (seconds < 1) return "instantly";

  let value = seconds;
  let unit = "second";
  for (const [factor, nextUnit] of TIME_UNITS) {
    if (value < factor) break;
    value /= factor;
    unit = nextUnit;
  }

  if (unit === "year" && value >= 100) {
    const centuries = value / 100;
    if (centuries >= 1e6) return "millions of centuries";
    return `${formatNumber(centuries)} centuries`;
  }

  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${formatNumber(rounded)} ${unit}${rounded === 1 ? "" : "s"}`;
}

function formatNumber(value: number): string {
  if (value >= 1e6) return value.toExponential(2).replace("e+", " x 10^");
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
