/**
 * Cryptographically secure password generator (Web Crypto API).
 * Mirrors Password-Strength-Analyzer/generator.py.
 */

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

/** Unbiased random index in [0, max) using rejection sampling. */
function secureIndex(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0]!;
  } while (value >= limit);
  return value % max;
}

/**
 * Build a random password that contains at least one character from every
 * enabled set, then shuffles the result so positions are not predictable.
 */
export function generatePassword(options: GeneratorOptions): string {
  const pools: string[] = [];
  if (options.uppercase) pools.push(CHARSETS.uppercase);
  if (options.lowercase) pools.push(CHARSETS.lowercase);
  if (options.numbers) pools.push(CHARSETS.numbers);
  if (options.symbols) pools.push(CHARSETS.symbols);

  if (pools.length === 0) {
    throw new Error("Select at least one character type.");
  }

  const length = Math.max(options.length, pools.length);
  const alphabet = pools.join("");

  // Guarantee one character from each selected pool.
  const chars = pools.map((pool) => pool[secureIndex(pool.length)]!);
  while (chars.length < length) {
    chars.push(alphabet[secureIndex(alphabet.length)]!);
  }

  // Fisher-Yates shuffle with secure randomness.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}
