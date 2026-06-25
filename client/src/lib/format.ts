/// Shared display formatters. One place so addresses, dates and hashes read the
/// same everywhere instead of each component slicing strings inline.

/// Shorten a wallet address / hex value to `0x1234…abcd`. Returns "—" when empty.
export function formatAddress(value: string | undefined | null): string {
  if (!value) return "—";
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

/// Truncate a long hash (e.g. a transaction hash) to its first `keep` chars.
export function formatTxHash(hash: string | undefined | null, keep = 10): string {
  return hash ? `${hash.slice(0, keep)}…` : "";
}

/// Base Sepolia block explorer. Every on-chain action links here so users can
/// watch their transaction confirm in real time instead of trusting the UI.
const EXPLORER = "https://sepolia.basescan.org";

/// Link to a transaction on the explorer (live status as it confirms).
export function explorerTxUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

/// Link to a wallet / contract address on the explorer.
export function explorerAddressUrl(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

/// Human label for a price tier. Uses the organizer's name ("Platinum",
/// "Balcony") when set, falling back to a generic "Tier N" so older events and
/// half-filled forms still read cleanly.
export function tierLabel(tier: { tierNames?: string[] } | undefined, index: number): string {
  const name = tier?.tierNames?.[index]?.trim();
  return name || `Tier ${index + 1}`;
}

const DATE_TIME: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/// Full date and time, e.g. "Sat, 12 Jul 2025, 7:00 PM". Empty if unparseable.
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, DATE_TIME);
}

/// Date without time, e.g. "12 Jul 2025".
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, DATE_ONLY);
}

/// Clock time only, e.g. "19:00".
export function formatTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/// True when the given event time is in the past (used to flag ended events).
export function isPast(iso: string | undefined | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}
