import type { ErrorRequestHandler } from "express";

/// Last-resort error handler. With express-async-errors installed, rejected
/// promises in async route handlers reach here too. We log the real error
/// server-side but never leak its message or stack to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: "internal server error" });
};
