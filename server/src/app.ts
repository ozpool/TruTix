import express, { type Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { staffRouter } from "./routes/staff";
import { verifyRouter } from "./routes/verify";
import { eventsRouter } from "./routes/events";
import { orgEventsRouter } from "./routes/orgEvents";
import { resaleRouter } from "./routes/resale";
import { ticketsRouter } from "./routes/tickets";

/// Build the Express app without binding a port, so tests can drive it directly.
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/org/staff", staffRouter);
  app.use("/org/events", orgEventsRouter);
  app.use("/verify", verifyRouter);
  app.use("/events", eventsRouter);
  app.use("/resale", resaleRouter);
  app.use("/tickets", ticketsRouter);
  return app;
}
