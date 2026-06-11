import { Router } from "express";
import { Event } from "../models";

export const eventsRouter = Router();

/// Public list of approved events.
eventsRouter.get("/", async (_req, res) => {
  res.json({ events: await Event.find({ approved: true }) });
});

/// Public single event by its on-chain id.
eventsRouter.get("/:eventId", async (req, res) => {
  const event = await Event.findOne({ eventId: Number(req.params.eventId) });
  if (!event) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(event);
});
