import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupDb, teardownDb } from "./helpers/db";
import { dispatch } from "../src/indexer/dispatch";
import { TicketOwner, ResaleListing } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

describe("indexer dispatch", () => {
  it("routes a mint then a transfer to the owner cache", async () => {
    await dispatch("TicketMinted", { tokenId: 10, eventId: 3, to: "0xAlice", tier: 0, seat: 5 });
    expect((await TicketOwner.findOne({ tokenId: 10 }))?.owner).toBe("0xalice");

    await dispatch("Transfer", { from: "0xAlice", to: "0xBob", tokenId: 10 });
    expect((await TicketOwner.findOne({ tokenId: 10 }))?.owner).toBe("0xbob");
  });

  it("ignores the mint Transfer (from the zero address)", async () => {
    const zero = "0x0000000000000000000000000000000000000000";
    await dispatch("Transfer", { from: zero, to: "0xCarol", tokenId: 99 });
    // No owner row created: the real mint is handled by TicketMinted only.
    expect(await TicketOwner.findOne({ tokenId: 99 })).toBeNull();
  });

  it("activates a listing on Listed and clears it on Sold", async () => {
    await dispatch("TicketMinted", { tokenId: 11, eventId: 3, to: "0xAlice", tier: 0, seat: 6 });
    await dispatch("Listed", { tokenId: 11, seller: "0xAlice", price: "1000" });
    expect((await ResaleListing.findOne({ tokenId: 11 }))?.active).toBe(true);

    await dispatch("Sold", { tokenId: 11 });
    expect((await ResaleListing.findOne({ tokenId: 11 }))?.active).toBe(false);
  });
});
