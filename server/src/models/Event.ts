import { Schema, model, type InferSchemaType } from "mongoose";

/// Off-chain event content plus a cache of the on-chain terms, for search and UI.
const eventSchema = new Schema(
  {
    eventId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    organizer: { type: String, required: true, lowercase: true, index: true },
    approved: { type: Boolean, default: false, index: true },
    capacity: { type: Number, required: true },
    maxResalePct: { type: Number, required: true },
    royaltyBps: { type: Number, required: true },
    startsAt: { type: Date, required: true },
    tierPrices: { type: [String], default: [] },
    tierNames: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type EventDoc = InferSchemaType<typeof eventSchema>;
export const Event = model("Event", eventSchema);
