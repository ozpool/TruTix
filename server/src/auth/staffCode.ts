import { randomBytes, createHash } from "node:crypto";

// No ambiguous characters (0/O, 1/I/L) so codes are easy to read and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ALPHA_LEN = ALPHABET.length; // 31
// Rejection threshold: discard bytes >= this to eliminate modulo bias.
// (256 % 31 = 8, so bytes 248-255 are biased toward the first 8 letters.)
const REJECT_ABOVE = 256 - (256 % ALPHA_LEN); // 248

/// Pick n unbiased random characters from ALPHABET using rejection sampling.
function randomChars(n: number): string {
  let out = "";
  while (out.length < n) {
    const buf = randomBytes(n - out.length + 4); // overshoot so loops are rare
    for (const b of buf) {
      if (b < REJECT_ABOVE) out += ALPHABET.charAt(b % ALPHA_LEN);
      if (out.length === n) break;
    }
  }
  return out;
}

/// A human-typeable staff code, e.g. "K7P2-9QXM-3AB". 12 chars from a
/// 31-character alphabet gives ~62 bits of entropy — infeasible to brute-force
/// even offline, and instantly revocable by setting active=false.
export function generateStaffCode(): string {
  const c = randomChars(12);
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}

/// Deterministic hash so a presented code can be looked up by hash without ever
/// storing the code itself. Normalizes case and separators first, so "k7p2-9qxm"
/// and "K7P29QXM" resolve to the same account.
export function hashStaffCode(code: string): string {
  const normalized = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}
