import "dotenv/config";
import { z } from "zod";

const DEV_JWT_SECRET = "dev-only-insecure-secret-change-me!!";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/trutix"),
  JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
  SIWE_DOMAIN: z.string().default("localhost"),
  // Allowed browser origin(s) for CORS. Comma-separated to cover preview +
  // production deploys. Defaults to the Vite dev server.
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  // The gate QR anti-replay window. Defaults to 60s (the product invariant);
  // override only for local manual testing, never widen it in production.
  GATE_FRESHNESS_MS: z.coerce.number().int().positive().default(60_000),
  RPC_URL: z.string().default("https://sepolia.base.org"),
  BACKEND_PRIVATE_KEY: z.string().optional(),
  EVENT_TICKET_ADDR: z.string().optional(),
  MARKETPLACE_ADDR: z.string().optional(),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;

// Browser origins allowed through CORS, parsed from the comma-separated env.
export const corsOrigins = config.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Deny-by-default: any environment other than development/test must supply real
// secrets, so a misconfigured or unset NODE_ENV in a deployment fails closed.
const isLocalEnv = config.NODE_ENV === "development" || config.NODE_ENV === "test";
if (!isLocalEnv) {
  if (config.JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error("JWT_SECRET must be set to a strong value outside development");
  }
  if (config.SIWE_DOMAIN === "localhost") {
    throw new Error("SIWE_DOMAIN must be set to the deployment origin outside development");
  }
  if (config.CLIENT_ORIGIN === "http://localhost:5173") {
    throw new Error("CLIENT_ORIGIN must be set to the deployment origin(s) outside development");
  }
  // Redemption cannot work without the redeemer key; fail at boot rather than
  // at the gate when a staff member scans the first ticket.
  if (!/^0x[0-9a-fA-F]{64}$/.test(config.BACKEND_PRIVATE_KEY ?? "")) {
    throw new Error("BACKEND_PRIVATE_KEY must be a 32-byte hex key outside development");
  }
}
