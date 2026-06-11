import { Router } from "express";
import { z } from "zod";
import { StaffAccount } from "../models";
import { requireOrganizer, type AuthedRequest } from "../auth/middleware";
import { signStaffToken } from "../auth/jwt";

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

  const staff = await StaffAccount.create({
    eventId: parsed.data.eventId,
    venue: parsed.data.venue,
    label: parsed.data.label ?? "",
    createdBy: organizer,
  });
  const token = signStaffToken({ staffId: staff.id, eventId: staff.eventId, venue: staff.venue });
  res.status(201).json({ staffId: staff.id, token });
});

/// Organizer lists staff, optionally filtered by event.
staffRouter.get("/", requireOrganizer, async (req: AuthedRequest, res) => {
  const eventId = Number(req.query.eventId);
  const filter = Number.isFinite(eventId) ? { eventId } : {};
  res.json({ staff: await StaffAccount.find(filter) });
});
