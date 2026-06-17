import { Router } from "express";
import { redeemerAddress } from "../chain/wallet";

export const redeemerRouter = Router();

/// The wallet the backend uses to submit markRedeemed. Organizers call
/// grantRedeemer(eventId, address) with this so gate scans can settle
/// on-chain. Public: the address is already visible in on-chain grants,
/// and the create-event flow must reach it even with an expired session.
redeemerRouter.get("/", (_req, res) => {
  const address = redeemerAddress();
  if (!address) {
    res.status(503).json({ error: "redeemer wallet not configured" });
    return;
  }
  res.json({ address });
});
