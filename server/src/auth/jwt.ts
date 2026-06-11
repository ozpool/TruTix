import jwt from "jsonwebtoken";
import { config } from "../config";

const ORGANIZER_TTL_SECONDS = 60 * 60 * 2; // 2 hours
const STAFF_TTL_SECONDS = 60 * 60 * 12; // one shift

export interface OrganizerClaims {
  sub: string; // organizer wallet address (lowercased)
  role: "organizer";
}

export interface StaffClaims {
  sub: string; // staff account id
  role: "staff";
  eventId: number;
  venue: string;
}

export function signOrganizerToken(address: string): string {
  return jwt.sign({ role: "organizer" }, config.JWT_SECRET, {
    algorithm: "HS256",
    subject: address.toLowerCase(),
    expiresIn: ORGANIZER_TTL_SECONDS,
  });
}

export function verifyOrganizerToken(token: string): OrganizerClaims {
  const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || payload.role !== "organizer" || !payload.sub) {
    throw new Error("invalid organizer token");
  }
  return { sub: payload.sub, role: "organizer" };
}

export function signStaffToken(params: {
  staffId: string;
  eventId: number;
  venue: string;
}): string {
  return jwt.sign(
    { role: "staff", eventId: params.eventId, venue: params.venue },
    config.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: params.staffId,
      expiresIn: STAFF_TTL_SECONDS,
    },
  );
}

export function verifyStaffToken(token: string): StaffClaims {
  const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
  if (
    typeof payload === "string" ||
    payload.role !== "staff" ||
    !payload.sub ||
    typeof payload.eventId !== "number" ||
    typeof payload.venue !== "string"
  ) {
    throw new Error("invalid staff token");
  }
  return { sub: payload.sub, role: "staff", eventId: payload.eventId, venue: payload.venue };
}
