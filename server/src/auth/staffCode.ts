import { randomBytes, createHash } from "node:crypto";

// No ambiguous characters (0/O, 1/I/L) so codes are easy to read and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/// A short, human-typeable staff code, e.g. "K7P2-9QXM". ~39 bits of entropy —
/// ample against an online, rate-limited, revocable gate login (the only attack
/// surface, since we store the hash, never the code).
export function generateStaffCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += ALPHABET.charAt(b % ALPHABET.length);
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/// Deterministic hash so a presented code can be looked up by hash without ever
/// storing the code itself. Normalizes case and separators first, so "k7p2-9qxm"
/// and "K7P29QXM" resolve to the same account.
export function hashStaffCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}
