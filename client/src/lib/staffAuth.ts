import { apiGet } from "./api";

const STORAGE_KEY = "trutix.staffCode";

/// The scope a staff code unlocks, returned by the server after it validates
/// the code. The code itself is opaque (no readable claims), so the scanner
/// fetches this to label its header.
export interface StaffSession {
  eventId: number;
  venue: string;
  eventName: string;
}

export function getStaffCode(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStaffCode(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export function clearStaffCode(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/// Validate a staff code against the server and return its scope. The code is
/// the bearer credential; the server hashes it and looks up an active account.
/// Rejects (throws) on an unknown or revoked code.
export function fetchStaffSession(code: string): Promise<StaffSession> {
  return apiGet<StaffSession>("/org/staff/me", code.trim());
}
