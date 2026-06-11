import { Router } from "express";
import { z } from "zod";
import { requireStaff, type StaffRequest } from "../auth/middleware";
import { verifyTicket } from "../services/verify";

export const verifyRouter = Router();

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

  res.json(result);
});
