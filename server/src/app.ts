import "express-async-errors";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "./config";
import { apiLimiter, authLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { staffRouter } from "./routes/staff";
import { verifyRouter } from "./routes/verify";
import { redemptionsRouter } from "./routes/redemptions";
import { eventsRouter } from "./routes/events";
import { orgEventsRouter } from "./routes/orgEvents";
import { redeemerRouter } from "./routes/redeemer";
import { resaleRouter } from "./routes/resale";
import { ticketsRouter } from "./routes/tickets";

/// Build the Express app without binding a port, so tests can drive it directly.
export function createApp(): Express {
  const app = express();
  // Trust the proxy (Render/Vercel) so rate-limit sees the real client IP.
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "16kb" }));
  app.use(apiLimiter);

  app.use("/health", healthRouter);
  app.use("/auth", authLimiter, authRouter);
  app.use("/org/staff", staffRouter);
  app.use("/org/events", orgEventsRouter);
  app.use("/org/redeemer", redeemerRouter);
  app.use("/verify", verifyRouter);
  app.use("/redemptions", redemptionsRouter);
  app.use("/events", eventsRouter);
  app.use("/resale", resaleRouter);
  app.use("/tickets", ticketsRouter);

  app.use(errorHandler);
  return app;
}
