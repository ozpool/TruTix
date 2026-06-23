import { type Request, type Response, type NextFunction } from "express";
import { verifyOrganizerToken } from "./jwt";
import { hashStaffCode } from "./staffCode";
import { StaffAccount } from "../models";

export interface AuthedRequest extends Request {
  organizer?: string;
}

export interface StaffRequest extends Request {
  staff?: { staffId: string; eventId: number; venue: string };
}

function bearer(req: Request): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

/// Gate a route to authenticated organizers; attaches `req.organizer`.
export function requireOrganizer(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = bearer(req);
  if (!token) {
    res.status(401).json({ error: "missing token" });
    return;
  }
  try {
    req.organizer = verifyOrganizerToken(token).sub;
    next();
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
}

/// Gate a route to authenticated venue staff; attaches `req.staff` with its
/// scope. The bearer credential is the staff sign-in code: we hash it and look
/// up an active account, so codes are revocable (set active=false) and a leaked
/// DB row (which holds only the hash) can't be used to sign in.
export function requireStaff(req: StaffRequest, res: Response, next: NextFunction): void {
  const code = bearer(req);
  if (!code) {
    res.status(401).json({ error: "missing code" });
    return;
  }
  StaffAccount.findOne({ codeHash: hashStaffCode(code), active: true })
    .then((account) => {
      if (!account) {
        res.status(401).json({ error: "invalid code" });
        return;
      }
      req.staff = { staffId: account.id, eventId: account.eventId, venue: account.venue };
      next();
    })
    .catch(() => res.status(500).json({ error: "auth lookup failed" }));
}
