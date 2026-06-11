import { Router } from "express";
import { ResaleListing } from "../models";

export const resaleRouter = Router();

/// Public list of active resale listings (cache of the on-chain marketplace).
resaleRouter.get("/", async (_req, res) => {
  res.json({ listings: await ResaleListing.find({ active: true }) });
});
