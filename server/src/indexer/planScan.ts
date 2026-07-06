export type ScanSource = "primary" | "backfill";

export interface ScanPlan {
  from: bigint;
  to: bigint;
  source: ScanSource;
}

/// Pure planner: decide the next block range to scan and which RPC to read it
/// from. Deep gaps (below the tip-safety margin) use the backfill RPC in large
/// chunks; anything within the margin always uses the primary RPC in small
/// steps, since the backfill index can lag behind the true chain tip.
export function planScan(
  head: bigint,
  cursor: bigint,
  tipSafety: bigint,
  backfillMaxRange: bigint,
  primaryTipRange: bigint,
  backfillConfigured: boolean,
): ScanPlan {
  const from = cursor + 1n;
  const safeHead = head > tipSafety ? head - tipSafety : 0n;

  if (backfillConfigured && safeHead >= from) {
    const to = safeHead - from + 1n > backfillMaxRange ? from + backfillMaxRange - 1n : safeHead;
    return { from, to, source: "backfill" };
  }

  const to = head - from + 1n > primaryTipRange ? from + primaryTipRange - 1n : head;
  return { from, to, source: "primary" };
}
