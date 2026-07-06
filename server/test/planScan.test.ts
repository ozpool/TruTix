import { describe, it, expect } from "vitest";
import { planScan } from "../src/indexer/planScan";

const TIP_SAFETY = 300n;
const BACKFILL_MAX_RANGE = 5_000n;
const PRIMARY_TIP_RANGE = 10n;

describe("planScan", () => {
  it("uses the backfill RPC for a deep gap, capped at the max range", () => {
    const plan = planScan(100_000n, 0n, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, true);
    expect(plan.source).toBe("backfill");
    expect(plan.from).toBe(1n);
    expect(plan.to).toBe(BACKFILL_MAX_RANGE);
  });

  it("uses the primary RPC near the tip, stepping by the small tip range", () => {
    const head = 100_000n;
    const cursor = head - 5n; // well within tip safety
    const plan = planScan(head, cursor, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, true);
    expect(plan.source).toBe("primary");
    expect(plan.from).toBe(cursor + 1n);
    expect(plan.to).toBe(head);
  });

  it("falls back to the primary RPC when no backfill client is configured", () => {
    const plan = planScan(100_000n, 0n, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, false);
    expect(plan.source).toBe("primary");
    expect(plan.to).toBe(PRIMARY_TIP_RANGE);
  });

  it("never scans past the tip-safety boundary via backfill", () => {
    const head = 1_000n;
    const cursor = 0n;
    const plan = planScan(head, cursor, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, true);
    expect(plan.source).toBe("backfill");
    expect(plan.to).toBe(head - TIP_SAFETY);
    expect(plan.to).toBeLessThan(head);
  });

  it("hands off to primary once the gap is inside the tip-safety margin", () => {
    const head = 1_000n;
    const cursor = head - TIP_SAFETY; // exactly at the boundary
    const plan = planScan(head, cursor, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, true);
    expect(plan.source).toBe("primary");
    expect(plan.from).toBe(cursor + 1n);
  });

  it("on a tiny chain (head below tip safety) always uses primary", () => {
    const plan = planScan(50n, 0n, TIP_SAFETY, BACKFILL_MAX_RANGE, PRIMARY_TIP_RANGE, true);
    expect(plan.source).toBe("primary");
    expect(plan.to).toBeLessThanOrEqual(50n);
  });

  it("invariant: from <= to <= head for a spread of configs", () => {
    const cases: Array<[bigint, bigint, bigint, bigint, bigint, boolean]> = [
      [100_000n, 0n, 300n, 5_000n, 10n, true],
      [100_000n, 99_990n, 300n, 5_000n, 10n, true],
      [100_000n, 0n, 300n, 5_000n, 10n, false],
      [500n, 0n, 300n, 5_000n, 10n, true],
      [300n, 299n, 300n, 5_000n, 10n, true],
      [10n, 0n, 300n, 5_000n, 10n, true],
    ];
    for (const [head, cursor, tipSafety, maxRange, tipRange, backfillOn] of cases) {
      const plan = planScan(head, cursor, tipSafety, maxRange, tipRange, backfillOn);
      expect(plan.from <= plan.to).toBe(true);
      expect(plan.to <= head).toBe(true);
      expect(plan.from).toBe(cursor + 1n);
    }
  });
});
