import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { RequestHandler } from "express";
import { config } from "../config";

/// Rate limiters guard against floods (nonce spam, credential stuffing). They
/// are disabled under test so the suite can fire many requests without tripping.
const passthrough: RequestHandler = (_req, _res, next) => next();

function limiter(windowMs: number, max: number): RateLimitRequestHandler | RequestHandler {
  if (config.NODE_ENV === "test") return passthrough;
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "too many requests, slow down" },
  });
}

/// Broad ceiling applied to every route — a backstop against abusive clients.
export const apiLimiter = limiter(60_000, 300);

/// Tight limit on unauthenticated sign-in routes, which write a nonce per call.
export const authLimiter = limiter(15 * 60_000, 30);
