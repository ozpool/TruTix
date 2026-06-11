import { Schema, model, type InferSchemaType } from "mongoose";

/// Cache of on-chain marketplace listings, for fast browsing. The contract is truth.
const resaleListingSchema = new Schema(
  {
    tokenId: { type: Number, required: true, unique: true, index: true },
    eventId: { type: Number, required: true, index: true },
    price: { type: String, required: true },
    seller: { type: String, required: true, lowercase: true },
    active: { type: Boolean, default: true, index: true },
    listedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export type ResaleListingDoc = InferSchemaType<typeof resaleListingSchema>;
export const ResaleListing = model("ResaleListing", resaleListingSchema);
