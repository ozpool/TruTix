import jwt from "jsonwebtoken";
import { config } from "../config";

const ORGANIZER_TTL_SECONDS = 60 * 60 * 2; // 2 hours

export interface OrganizerClaims {
  sub: string; // organizer wallet address (lowercased)
  role: "organizer";
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
