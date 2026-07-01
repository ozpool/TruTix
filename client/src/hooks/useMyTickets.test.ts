import { describe, it, expect } from "vitest";
import { mergeTickets } from "./useMyTickets";
import { type Ticket } from "./useTickets";

const ticket = (tokenId: number, owner = "0xabc"): Ticket => ({
  tokenId,
  eventId: 1,
  owner,
  tier: 0,
  seat: 1,
});

describe("mergeTickets", () => {
  it("unions tickets from both sources, sorted by tokenId", () => {
    const result = mergeTickets([ticket(2)], [ticket(1)]);
    expect(result.map((t) => t.tokenId)).toEqual([1, 2]);
  });

  it("shows a chain-only ticket the indexer cache is missing (the core bug)", () => {
    expect(mergeTickets([ticket(5)], []).map((t) => t.tokenId)).toEqual([5]);
  });

  it("prefers the on-chain record on a conflict", () => {
    const merged = mergeTickets([ticket(1, "0xchain")], [ticket(1, "0xstale")]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.owner).toBe("0xchain");
  });

  it("returns empty when neither source has tickets", () => {
    expect(mergeTickets([], [])).toEqual([]);
  });
});
