import { describe, it, expect } from "vitest";
import { pickListings, type Listing } from "./useResale";

const listing = (tokenId: number, seller = "0xabc"): Listing => ({
  tokenId,
  eventId: 1,
  price: "1000",
  seller,
});

describe("pickListings", () => {
  it("uses the chain result when the chain read succeeds", () => {
    const result = pickListings(
      { isSuccess: true, data: [listing(1)] },
      { data: [listing(1), listing(2)] },
    );
    expect(result?.map((l) => l.tokenId)).toEqual([1]);
  });

  it("drops a listing the cache still shows as active but the chain does not (sold/cancelled)", () => {
    const result = pickListings({ isSuccess: true, data: [] }, { data: [listing(1)] });
    expect(result).toEqual([]);
  });

  it("falls back to the cache when the chain read itself failed", () => {
    const result = pickListings({ isSuccess: false, data: undefined }, { data: [listing(1)] });
    expect(result?.map((l) => l.tokenId)).toEqual([1]);
  });
});
