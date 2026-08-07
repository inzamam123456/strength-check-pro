/**
 * Password scoring logic — mirrors the Flask backend in
 * Password-Strength-Analyzer/app.py so the live preview behaves identically.
 *
 * Each of the five rules is worth 20 points (total 100).
 */

export const MIN_LENGTH = 8;
const POINTS_PER_RULE = 20;

export type RuleKey = "length" | "uppercase" | "lowercase" | "number" | "special";

export interface Check {
  key: RuleKey;
  label: string;
  passed: boolean;
}

export interface Analysis {
  score: number;
  strength: "Weak" | "Medium" | "Strong";
  checks: Check[];
  missing: string[];
  suggestions: string[];
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
    suggestion: `Make your password at least ${MIN_LENGTH} characters long.`,
    test: (pw) => pw.length >= MIN_LENGTH,
  },
  {
    key: "uppercase",
    label: "Uppercase letter (A-Z)",
    suggestion: "Add at least one uppercase letter.",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lowercase",
    label: "Lowercase letter (a-z)",
    suggestion: "Add at least one lowercase letter.",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    key: "number",
    label: "Number (0-9)",
    suggestion: "Add at least one number.",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    key: "special",
    label: "Special character (!@#$...)",
    suggestion: "Add a special character such as ! @ # $ % &.",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function analyzePassword(password: string): Analysis {
  const checks: Check[] = RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    passed: rule.test(password),
  }));

  const score = checks.filter((c) => c.passed).length * POINTS_PER_RULE;
  const strength = score <= 40 ? "Weak" : score <= 80 ? "Medium" : "Strong";

  const failed = RULES.filter((rule) => !rule.test(password));
  const suggestions = failed.map((rule) => rule.suggestion);

  if (suggestions.length === 0) {
    suggestions.push("Great job! Consider using a passphrase of 16+ characters.");
  }

  return {
    score,
    strength,
    checks,
    missing: failed.map((rule) => rule.label),
    suggestions,
  };
}
