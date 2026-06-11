import { Schema, model, type InferSchemaType } from "mongoose";

/// Organizer identity and KYC state. Approval gates which organizers the UI lists.
const organizerProfileSchema = new Schema(
  {
    address: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    kycNotes: { type: String, default: "" },
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type OrganizerProfileDoc = InferSchemaType<typeof organizerProfileSchema>;
export const OrganizerProfile = model("OrganizerProfile", organizerProfileSchema);
