import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/trutix"),
  JWT_SECRET: z.string().default("dev-secret-change-me"),
  RPC_URL: z.string().default("https://sepolia.base.org"),
  BACKEND_PRIVATE_KEY: z.string().optional(),
  EVENT_TICKET_ADDR: z.string().optional(),
  MARKETPLACE_ADDR: z.string().optional(),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
