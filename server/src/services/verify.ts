import { recoverMessageAddress, type Address } from "viem";
import * as ticket from "../chain/eventTicket";

// TEMPORARY: widened from 60_000 (60s) to ease manual scan testing. Revert to
// 60_000 before the demo / production — the short window is the anti-replay.
const FRESHNESS_MS = 600_000;

/// The message a ticket holder signs for the gate QR. The frontend must build
/// the identical string for verification to succeed.
export function gateMessage(tokenId: number, timestamp: number): string {
  return `TruTix gate check\nticket: ${tokenId}\ntime: ${timestamp}`;
}

export type VerifyResult =
  | { state: "valid"; eventId: number; owner: Address }
  | { state: "stale" }
  | { state: "wrong_event" }
  | { state: "not_owner" }
  | { state: "already_redeemed" };

export interface VerifyInput {
  tokenId: number;
  timestamp: number;
  signature: `0x${string}`;
  staffEventId: number;
  now: number;
}

/// Read-only gate verification: freshness, signer recovery, event scope,
/// ownership, and redemption status. Does not mutate chain state.
export async function verifyTicket(input: VerifyInput): Promise<VerifyResult> {
  if (input.timestamp > input.now || input.now - input.timestamp > FRESHNESS_MS) {
    return { state: "stale" };
  }

  const signer = await recoverMessageAddress({
    message: gateMessage(input.tokenId, input.timestamp),
    signature: input.signature,
  });

  const tokenId = BigInt(input.tokenId);
  const eventId = Number(await ticket.ticketEvent(tokenId));
  if (eventId !== input.staffEventId) {
    return { state: "wrong_event" };
  }

  const owner = await ticket.ownerOf(tokenId);
  if (owner.toLowerCase() !== signer.toLowerCase()) {
    return { state: "not_owner" };
  }

  if (await ticket.isRedeemed(tokenId)) {
    return { state: "already_redeemed" };
  }

  return { state: "valid", eventId, owner };
}
