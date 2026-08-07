/**
 * Weak-pattern detection: common passwords, dictionary words, keyboard runs,
 * character sequences and repetition.
 * Mirrors Password-Strength-Analyzer/password_checker.py.
 */

export interface Weakness {
  id: string;
  /** Warning shown to the user. */
  message: string;
  /** Points removed from the raw score. */
  penalty: number;
  /** Suggestion offered to fix it. */
  suggestion: string;
}

/** A small embedded list of the most frequently breached passwords. */
export const COMMON_PASSWORDS = new Set([
  "123456", "123456789", "12345678", "12345", "1234567", "1234567890",
  "password", "password1", "passw0rd", "qwerty", "qwerty123", "abc123",
  "111111", "000000", "iloveyou", "admin", "administrator", "welcome",
  "monkey", "dragon", "letmein", "football", "baseball", "sunshine",
  "princess", "master", "shadow", "superman", "trustno1", "hello",
  "freedom", "whatever", "starwars", "login", "solo", "test", "guest",
  "root", "toor", "pass", "secret", "hunter2", "zaq12wsx", "asdfgh",
]);

/** Frequent dictionary words that weaken a password when embedded. */
const DICTIONARY_WORDS = [
  "password", "welcome", "admin", "login", "user", "secret", "money",
  "love", "hello", "summer", "winter", "spring", "autumn", "january",
  "monday", "friday", "google", "facebook", "amazon", "apple", "android",
  "dragon", "monkey", "shadow", "master", "princess", "football",
  "baseball", "sunshine", "computer", "internet", "server", "database",
  "india", "china", "london", "newyork", "school", "college", "student",
];

/** Common keyboard runs (checked in both directions). */
const KEYBOARD_PATTERNS = [
  "qwerty", "qwertyuiop", "asdf", "asdfgh", "asdfghjkl", "zxcv", "zxcvbn",
  "qazwsx", "1qaz2wsx", "poiuy", "lkjh", "mnbv", "1q2w3e", "qweasd",
];

/** Longest run of the same repeated character, e.g. "aaaa" -> 4. */
export function longestRepeat(password: string): number {
  let best = 0;
  let run = 0;
  let previous = "";
  for (const char of password) {
    run = char === previous ? run + 1 : 1;
    previous = char;
    if (run > best) best = run;
  }
  return best;
}

/** Longest ascending/descending run of consecutive characters ("abcd", "4321"). */
export function longestSequence(password: string): number {
  const lower = password.toLowerCase();
  let best = lower.length ? 1 : 0;
  let asc = 1;
  let desc = 1;

  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    asc = diff === 1 ? asc + 1 : 1;
    desc = diff === -1 ? desc + 1 : 1;
    best = Math.max(best, asc, desc);
  }
  return best;
}

/** Length of the longest repeated substring (>= 3 chars), e.g. "abcabc" -> 3. */
export function longestRepeatedBlock(password: string): number {
  const n = password.length;
  for (let size = Math.floor(n / 2); size >= 3; size--) {
    const seen = new Set<string>();
    for (let i = 0; i + size <= n; i++) {
      const chunk = password.slice(i, i + size);
      if (seen.has(chunk)) return size;
      seen.add(chunk);
    }
  }
  return 0;
}

/** Run every pattern detector and return the weaknesses that apply. */
export function detectWeaknesses(password: string): Weakness[] {
  const found: Weakness[] = [];
  const lower = password.toLowerCase();
  // Strip common leet substitutions so "P@ssw0rd" still matches "password".
  const normalized = lower
    .replace(/[@4]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "l")
    .replace(/[3]/g, "e")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");

  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(normalized)) {
    found.push({
      id: "common",
      message: "This is one of the most commonly breached passwords.",
      penalty: 45,
      suggestion: "Choose something unique — avoid passwords from breach lists.",
    });
  }

  const word = DICTIONARY_WORDS.find(
    (candidate) => normalized.includes(candidate) && candidate.length >= 4,
  );
  if (word && !found.some((w) => w.id === "common")) {
    found.push({
      id: "dictionary",
      message: `This password contains the common dictionary word "${word}".`,
      penalty: 15,
      suggestion: "Avoid common words; use an unrelated passphrase instead.",
    });
  }

  const keyboard = KEYBOARD_PATTERNS.find((pattern) => {
    const reversed = [...pattern].reverse().join("");
    return lower.includes(pattern) || lower.includes(reversed);
  });
  if (keyboard) {
    found.push({
      id: "keyboard",
      message: "This password contains a common keyboard pattern.",
      penalty: 18,
      suggestion: "Avoid keyboard runs such as qwerty or asdf.",
    });
  }

  const repeat = longestRepeat(password);
  if (repeat >= 3) {
    found.push({
      id: "repeat",
      message: `A single character repeats ${repeat} times in a row.`,
      penalty: Math.min(6 * (repeat - 2), 20),
      suggestion: "Avoid repeating the same character several times.",
    });
  }

  const sequence = longestSequence(password);
  if (sequence >= 4) {
    found.push({
      id: "sequence",
      message: `This password contains a ${sequence}-character sequence such as 1234 or abcd.`,
      penalty: Math.min(6 * (sequence - 3), 20),
      suggestion: "Avoid sequential numbers or letters.",
    });
  }

  const block = longestRepeatedBlock(password);
  if (block >= 3) {
    found.push({
      id: "block",
      message: `A ${block}-character sequence is repeated inside the password.`,
      penalty: Math.min(4 * block, 16),
      suggestion: "Avoid repeating the same chunk of characters.",
    });
  }

  return found;
}
