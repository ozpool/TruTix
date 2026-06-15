import { Router } from "express";
import { z } from "zod";
import { StaffAccount } from "../models";
import { requireOrganizer, type AuthedRequest } from "../auth/middleware";
import { signStaffToken } from "../auth/jwt";
import { eventOrganizer } from "../chain/eventTicket";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const staffRouter = Router();

const createBody = z.object({
  eventId: z.number().int(),
  venue: z.string().min(1),
  label: z.string().optional(),
});

/// Organizer creates a staff account for an event/venue and gets its scoped token.
staffRouter.post("/", requireOrganizer, async (req: AuthedRequest, res) => {
  const organizer = req.organizer;
  if (!organizer) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "eventId and venue are required" });
    return;
  }

  let onChainOrganizer: string;
  try {
    onChainOrganizer = await eventOrganizer(BigInt(parsed.data.eventId));
  } catch {
    res.status(502).json({ error: "could not verify the on-chain event" });
    return;
  }
  if (
    !onChainOrganizer ||
    onChainOrganizer === ZERO_ADDRESS ||
    onChainOrganizer.toLowerCase() !== organizer.toLowerCase()
  ) {
    res.status(403).json({ error: "not the event organizer" });
    return;
  }

  const staff = await StaffAccount.create({
    eventId: parsed.data.eventId,
    venue: parsed.data.venue,
    label: parsed.data.label ?? "",
    createdBy: organizer,
  });
  const token = signStaffToken({ staffId: staff.id, eventId: staff.eventId, venue: staff.venue });
  res.status(201).json({ staffId: staff.id, token });
});

/// Reissue a token for an existing staff account the caller owns. Tokens are
/// stateless JWTs that aren't stored, so this is how an organizer retrieves one
/// after the create-time reveal (e.g. to re-hand it to a door person).
staffRouter.post("/:id/token", requireOrganizer, async (req: AuthedRequest, res) => {
  const organizer = req.organizer;
  if (!organizer) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const staff = await StaffAccount.findById(req.params.id);
  if (!staff || staff.createdBy !== organizer) {
    res.status(404).json({ error: "staff not found" });
    return;
  }
  const token = signStaffToken({ staffId: staff.id, eventId: staff.eventId, venue: staff.venue });
  res.json({ token });
});

/// Organizer lists staff, optionally filtered by event.
staffRouter.get("/", requireOrganizer, async (req: AuthedRequest, res) => {
  const organizer = req.organizer;
  if (!organizer) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const eventId = Number(req.query.eventId);
  const filter: Record<string, unknown> = { createdBy: organizer };
  if (Number.isFinite(eventId)) filter.eventId = eventId;
  res.json({ staff: await StaffAccount.find(filter) });
});
