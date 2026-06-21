import { Router } from "express";
import { z } from "zod";
import { Event, StaffAccount } from "../models";
import {
  requireOrganizer,
  requireStaff,
  type AuthedRequest,
  type StaffRequest,
} from "../auth/middleware";
import { generateStaffCode, hashStaffCode } from "../auth/staffCode";
import { eventOrganizer } from "../chain/eventTicket";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const staffRouter = Router();

const createBody = z.object({
  eventId: z.number().int(),
  venue: z.string().min(1),
  label: z.string().optional(),
});

/// Organizer creates a staff account for an event/venue and gets a one-time
/// sign-in code. Only the code's hash is stored; the plaintext is returned here
/// once and never again (use the reissue route to mint a fresh one).
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

  const code = generateStaffCode();
  const staff = await StaffAccount.create({
    eventId: parsed.data.eventId,
    venue: parsed.data.venue,
    label: parsed.data.label ?? "",
    createdBy: organizer,
    codeHash: hashStaffCode(code),
  });
  res.status(201).json({ staffId: staff.id, code });
});

/// Reissue a fresh sign-in code for a staff account the caller owns. This
/// rotates the stored hash, so any previously issued code stops working.
staffRouter.post("/:id/code", requireOrganizer, async (req: AuthedRequest, res) => {
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
  const code = generateStaffCode();
  staff.codeHash = hashStaffCode(code);
  await staff.save();
  res.json({ code });
});

/// Organizer lists staff, optionally filtered by event. Never returns codeHash.
staffRouter.get("/", requireOrganizer, async (req: AuthedRequest, res) => {
  const organizer = req.organizer;
  if (!organizer) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const eventId = Number(req.query.eventId);
  const filter: Record<string, unknown> = { createdBy: organizer };
  if (Number.isFinite(eventId)) filter.eventId = eventId;
  res.json({ staff: await StaffAccount.find(filter).select("-codeHash") });
});

/// Staff session: a door person validates their code and gets their scope
/// (event name + venue) for the scanner header. Uses the staff code as bearer.
staffRouter.get("/me", requireStaff, async (req: StaffRequest, res) => {
  const staff = req.staff;
  if (!staff) {
    res.status(401).json({ error: "missing code" });
    return;
  }
  const event = await Event.findOne({ eventId: staff.eventId }).select("name").lean();
  res.json({
    eventId: staff.eventId,
    venue: staff.venue,
    eventName: event?.name ?? "",
  });
});
