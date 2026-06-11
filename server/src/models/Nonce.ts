import { Schema, model } from "mongoose";

/// Single-use SIWE nonces. The TTL index expires them after 5 minutes.
const nonceSchema = new Schema({
  nonce: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: () => new Date(), expires: 300 },
});

export const Nonce = model("Nonce", nonceSchema);
