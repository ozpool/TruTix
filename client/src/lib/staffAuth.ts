const STORAGE_KEY = "trutix.staffToken";

export interface StaffClaims {
  eventId: number;
  venue: string;
}

export function getStaffToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStaffToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearStaffToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/// Decode a JWT's payload for display only (no signature check — the backend
/// is the authority). Returns null if the token is malformed.
export function decodeStaffClaims(token: string): StaffClaims | null {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as Partial<StaffClaims>;
    if (typeof claims.eventId !== "number" || typeof claims.venue !== "string") return null;
    return { eventId: claims.eventId, venue: claims.venue };
  } catch {
    return null;
  }
}
