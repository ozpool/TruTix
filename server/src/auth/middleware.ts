import { type Request, type Response, type NextFunction } from "express";
import { verifyOrganizerToken } from "./jwt";

export interface AuthedRequest extends Request {
  organizer?: string;
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
