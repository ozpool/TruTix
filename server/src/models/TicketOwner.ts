import { Schema, model, type InferSchemaType } from "mongoose";

/// Cache of current ticket ownership, kept in sync by the indexer from Transfer events.
const ticketOwnerSchema = new Schema(
  {
    tokenId: { type: Number, required: true, unique: true, index: true },
    eventId: { type: Number, required: true, index: true },
    owner: { type: String, required: true, lowercase: true, index: true },
    tier: { type: Number, required: true },
    seat: { type: Number, required: true },
  },
  { timestamps: true },
);

export type TicketOwnerDoc = InferSchemaType<typeof ticketOwnerSchema>;
export const TicketOwner = model("TicketOwner", ticketOwnerSchema);
