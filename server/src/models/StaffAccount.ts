import { Schema, model, type InferSchemaType } from "mongoose";

/// A venue-staff account, scoped to one event and venue, created by an organizer.
const staffAccountSchema = new Schema(
  {
    eventId: { type: Number, required: true, index: true },
    venue: { type: String, required: true },
    label: { type: String, default: "" },
    address: { type: String, lowercase: true },
    active: { type: Boolean, default: true },
    createdBy: { type: String, required: true, lowercase: true },
    // SHA-256 of the staff sign-in code. The code is shown once at issuance and
    // never stored; sign-in hashes the presented code and looks it up here, so a
    // leaked DB row cannot be used to sign in.
    codeHash: { type: String, index: true },
  },
  { timestamps: true },
);

export type StaffAccountDoc = InferSchemaType<typeof staffAccountSchema>;
export const StaffAccount = model("StaffAccount", staffAccountSchema);
