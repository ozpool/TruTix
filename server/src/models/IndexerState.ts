import { Schema, model, type InferSchemaType } from "mongoose";

/// A single-row cursor recording the last block the indexer has fully
/// processed. Persisting it lets the indexer resume after a restart or RPC
/// outage and catch up the blocks it missed, instead of silently dropping them.
const indexerStateSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "default" },
  lastBlock: { type: Number, required: true },
});

export type IndexerStateDoc = InferSchemaType<typeof indexerStateSchema>;
export const IndexerState = model("IndexerState", indexerStateSchema);
