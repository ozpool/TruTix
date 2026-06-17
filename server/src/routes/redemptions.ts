import { Router } from "express";
import { requireStaff, type StaffRequest } from "../auth/middleware";
import { RedemptionLog } from "../models";

export const redemptionsRouter = Router();

/// Staff-only redemption history: the admissions THIS staff member scanned in
/// (who was let through, when, and the tx). Scoped to the staff id and event
/// from the JWT — never a query param — so a guard sees only their own scans,
/// not every scanner's at the venue.
redemptionsRouter.get("/", requireStaff, async (req: StaffRequest, res) => {
  const staff = req.staff;
  if (!staff) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  const redemptions = await RedemptionLog.find({
    eventId: staff.eventId,
    staffId: staff.staffId,
  })
    .sort({ redeemedAt: -1 })
    .limit(100);
  res.json({ redemptions });
});
