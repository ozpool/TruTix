import "dotenv/config";
import { z } from "zod";

const DEV_JWT_SECRET = "dev-only-insecure-secret-change-me!!";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/trutix"),
  JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
  SIWE_DOMAIN: z.string().default("localhost"),
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
}
