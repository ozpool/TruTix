import { Router } from "express";
import { z } from "zod";
import { requireStaff, type StaffRequest } from "../auth/middleware";
import { verifyTicket } from "../services/verify";
import { redeemTicket } from "../services/redeem";
import { Event, TicketOwner } from "../models";

export const verifyRouter = Router();

/// Display-only enrichment for an admitted scan: the event name and the
/// ticket's tier/seat from the indexer cache, so staff see human context
/// rather than raw ids. Never affects the admit decision (that is on-chain).
async function admitDetails(eventId: number, tokenId: number) {
  const [event, owner] = await Promise.all([
    Event.findOne({ eventId }).select("name").lean(),
    TicketOwner.findOne({ tokenId }).select("tier seat").lean(),
  ]);
  return {
    eventName: event?.name ?? "",
    tier: owner?.tier,
    seat: owner?.seat,
  };
}

const body = z.object({
  tokenId: z.number().int().nonnegative(),
  timestamp: z.number().int().nonnegative(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

/// Staff scans a QR; this returns a distinct verification state, no mutation.
verifyRouter.post("/", requireStaff, async (req: StaffRequest, res) => {
  const staff = req.staff;
  if (!staff) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const parsed = body.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "tokenId, timestamp and signature are required" });
    return;
  }

  const result = await verifyTicket({
    tokenId: parsed.data.tokenId,
    timestamp: parsed.data.timestamp,
    signature: parsed.data.signature as `0x${string}`,
    staffEventId: staff.eventId,
    now: Date.now(),
  });

  if (result.state !== "valid") {
    res.json(result);
    return;
  }

  try {
    const { txHash } = await redeemTicket({
      tokenId: parsed.data.tokenId,
      eventId: result.eventId,
      staffId: staff.staffId,
      owner: result.owner,
    });
    const details = await admitDetails(result.eventId, parsed.data.tokenId);
    res.json({ state: "valid", eventId: result.eventId, owner: result.owner, txHash, ...details });
  } catch {
    // tx reverted (e.g. a parallel scan won the race) or the chain was unreachable;
    // do not record a redemption.
    res.json({ state: "redeem_failed" });
  }
});
