import { Router } from "express";
import { z } from "zod";
import { Event } from "../models";
import { requireOrganizer, type AuthedRequest } from "../auth/middleware";

export const orgEventsRouter = Router();

const upsertBody = z.object({
  eventId: z.number().int().nonnegative(),
  name: z.string().min(1),
  description: z.string().optional(),
  heroImage: z.string().optional(),
  capacity: z.number().int().positive(),
  maxResalePct: z.number().int().nonnegative(),
  royaltyBps: z.number().int().min(0).max(10_000),
  startsAt: z.coerce.date(),
  tierPrices: z.array(z.string()).optional(),
});

/// Create or replace the off-chain content for an event the caller organizes.
orgEventsRouter.post("/", requireOrganizer, async (req: AuthedRequest, res) => {
  const organizer = req.organizer;
  if (!organizer) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const parsed = upsertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid event payload" });
    return;
  }

  const existing = await Event.findOne({ eventId: parsed.data.eventId });
  if (existing && existing.organizer !== organizer) {
    res.status(403).json({ error: "not your event" });
    return;
  }

  const event = await Event.findOneAndUpdate(
    { eventId: parsed.data.eventId },
    { ...parsed.data, organizer },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json(event);
});

orgEventsRouter.get("/", requireOrganizer, async (req: AuthedRequest, res) => {
  res.json({ events: await Event.find({ organizer: req.organizer }) });
});

const patchBody = z.object({
  description: z.string().optional(),
  heroImage: z.string().optional(),
});

/// Update only the mutable content (description, hero image) of an owned event.
orgEventsRouter.patch("/:eventId", requireOrganizer, async (req: AuthedRequest, res) => {
  const parsed = patchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid update" });
    return;
  }
  const event = await Event.findOne({ eventId: Number(req.params.eventId) });
  if (!event) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (event.organizer !== req.organizer) {
    res.status(403).json({ error: "not your event" });
    return;
  }
  event.set(parsed.data);
  await event.save();
  res.json(event);
});
