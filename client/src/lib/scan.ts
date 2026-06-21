import { apiPost } from "./api";

export interface GatePayload {
  tokenId: number;
  timestamp: number;
  signature: `0x${string}`;
}

/// The verification states the backend returns from POST /verify.
export type ScanState =
  | "valid"
  | "stale"
  | "wrong_event"
  | "not_owner"
  | "already_redeemed"
  | "redeem_failed";

export interface ScanResult {
  state: ScanState;
  eventId?: number;
  owner?: string;
  txHash?: string;
  eventName?: string;
  tier?: number;
  seat?: number;
}

/// Parse the JSON a ticket pass encodes in its QR. Returns null if the text is
/// not a well-formed gate payload.
export function parseGatePayload(text: string): GatePayload | null {
  try {
    const raw = JSON.parse(text) as Partial<GatePayload>;
    if (
      typeof raw.tokenId !== "number" ||
      typeof raw.timestamp !== "number" ||
      typeof raw.signature !== "string" ||
      !/^0x[0-9a-fA-F]+$/.test(raw.signature)
    ) {
      return null;
    }
    return { tokenId: raw.tokenId, timestamp: raw.timestamp, signature: raw.signature };
  } catch {
    return null;
  }
}

/// Submit a scanned payload to the gate. The staff token scopes it to one event.
export function submitScan(payload: GatePayload, token: string): Promise<ScanResult> {
  return apiPost<ScanResult>("/verify", payload, token);
}
