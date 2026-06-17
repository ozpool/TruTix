import { Schema, model, type InferSchemaType } from "mongoose";

/// Accountability record for each gate redemption: who scanned, when, and the tx.
const redemptionLogSchema = new Schema(
  {
    tokenId: { type: Number, required: true, index: true },
    eventId: { type: Number, required: true, index: true },
    staffId: { type: String, required: true },
    owner: { type: String, default: "" },
    txHash: { type: String, default: "" },
    redeemedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export type RedemptionLogDoc = InferSchemaType<typeof redemptionLogSchema>;
export const RedemptionLog = model("RedemptionLog", redemptionLogSchema);
