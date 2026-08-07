/**
 * Password scoring engine.
 *
 * Score (0-100) blends four signals:
 *   - Length score        (max 30)
 *   - Character diversity (max 25)
 *   - Entropy             (max 45)
 *   - Pattern penalties   (subtracted)
 *
 * Mirrors Password-Strength-Analyzer/password_checker.py.
 */

import { calculateEntropy, entropyLabel, estimateCrackTime, type EntropyLabel } from "./entropy";
import { detectWeaknesses, type Weakness } from "./password-patterns";

export const MIN_LENGTH = 8;

export type RuleKey = "length" | "uppercase" | "lowercase" | "number" | "special";
export type Strength = "Weak" | "Medium" | "Good" | "Strong";

export interface Check {
  key: RuleKey;
  label: string;
  passed: boolean;
}

export interface Analysis {
  score: number;
  strength: Strength;
  entropy: number;
  entropyLabel: EntropyLabel;
  crackTime: string;
  checks: Check[];
  missing: string[];
  warnings: string[];
  suggestions: string[];
  analyzedAt: string;
}

const RULES: {
  key: RuleKey;
  label: string;
  suggestion: string;
  test: (pw: string) => boolean;
}[] = [
  {
    key: "length",
    label: `Minimum ${MIN_LENGTH} characters`,
    suggestion: `Increase password length to at least ${MIN_LENGTH} characters.`,
    test: (pw) => pw.length >= MIN_LENGTH,
  },
  {
    key: "uppercase",
    label: "Uppercase letter (A-Z)",
    suggestion: "Add uppercase letters.",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lowercase",
    label: "Lowercase letter (a-z)",
    suggestion: "Add lowercase letters.",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    key: "number",
    label: "Number (0-9)",
    suggestion: "Add numbers.",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    key: "special",
    label: "Special character (!@#$...)",
    suggestion: "Add a special character such as ! @ # $ % &.",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

/** Length contributes up to 30 points, saturating around 20 characters. */
function lengthScore(length: number): number {
  if (length === 0) return 0;
  return Math.min(30, Math.round((length / 20) * 30));
}

/** Diversity: 25 points shared across the four character families. */
function diversityScore(checks: Check[]): number {
  const families = checks.filter((c) => c.key !== "length" && c.passed).length;
  return Math.round((families / 4) * 25);
}

/** Entropy contributes up to 45 points, saturating at 80 bits. */
function entropyScore(bits: number): number {
  return Math.min(45, Math.round((bits / 80) * 45));
}

function toStrength(score: number): Strength {
  if (score <= 39) return "Weak";
  if (score <= 59) return "Medium";
  if (score <= 79) return "Good";
  return "Strong";
}

/** Analyze a password and return a full report. */
export function analyzePassword(password: string): Analysis {
  const checks: Check[] = RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    passed: rule.test(password),
  }));

  const entropy = calculateEntropy(password);
  const weaknesses: Weakness[] = detectWeaknesses(password);
  const penalty = weaknesses.reduce((total, weakness) => total + weakness.penalty, 0);

  const raw = lengthScore(password.length) + diversityScore(checks) + entropyScore(entropy);
  const score = Math.max(0, Math.min(100, raw - penalty));

  const failedRules = RULES.filter((rule) => !rule.test(password));

  // Relevant suggestions only: unmet rules first, then pattern fixes.
  const suggestions = [
    ...failedRules.map((rule) => rule.suggestion),
    ...weaknesses.map((weakness) => weakness.suggestion),
  ];

  if (password.length > 0 && password.length < 12) {
    suggestions.push("Use 12+ characters — length matters more than complexity.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Excellent password. Store it in a password manager and never reuse it.");
  }

  return {
    score,
    strength: toStrength(score),
    entropy,
    entropyLabel: entropyLabel(entropy),
    crackTime: estimateCrackTime(entropy),
    checks,
    missing: failedRules.map((rule) => rule.label),
    warnings: weaknesses.map((weakness) => weakness.message),
    suggestions: [...new Set(suggestions)],
    analyzedAt: new Date().toISOString(),
  };
}
