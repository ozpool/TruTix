const STORAGE_KEY = "trutix.orgToken";

export function getOrgToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setOrgToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearOrgToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/// Read the organizer's address (the JWT `sub`) for display only. Returns null
/// if the token is malformed — the backend remains the authority.
export function decodeOrgAddress(token: string): string | null {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { sub?: string };
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}
