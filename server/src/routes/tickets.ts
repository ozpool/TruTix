import { Router } from "express";
import { TicketOwner } from "../models";

export const ticketsRouter = Router();

/// Public: list a wallet's tickets from the indexer's owner cache.
ticketsRouter.get("/", async (req, res) => {
  const owner = String(req.query.owner ?? "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(owner)) {
    res.status(400).json({ error: "a valid owner address is required" });
    return;
  }
  res.json({ tickets: await TicketOwner.find({ owner }) });
});
