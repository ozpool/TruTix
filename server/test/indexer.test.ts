import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupDb, teardownDb } from "./helpers/db";
import {
  handleMinted,
  handleTransfer,
  handleListed,
  handleListingClosed,
} from "../src/indexer/handlers";
import { TicketOwner, ResaleListing } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

describe("indexer handlers", () => {
  it("records a mint, then updates the owner on transfer", async () => {
    await handleMinted({ tokenId: 1, eventId: 7, to: "0xAlice", tier: 0, seat: 1 });
    let owner = await TicketOwner.findOne({ tokenId: 1 });
    expect(owner?.owner).toBe("0xalice");
    expect(owner?.eventId).toBe(7);

    await handleTransfer({ tokenId: 1, to: "0xBob" });
    owner = await TicketOwner.findOne({ tokenId: 1 });
    expect(owner?.owner).toBe("0xbob");
  });

  it("activates a listing and deactivates it when closed", async () => {
    await handleMinted({ tokenId: 2, eventId: 7, to: "0xAlice", tier: 0, seat: 2 });
    await handleListed({ tokenId: 2, seller: "0xAlice", price: "1000" });

    let listing = await ResaleListing.findOne({ tokenId: 2 });
    expect(listing?.active).toBe(true);
    expect(listing?.eventId).toBe(7);

    await handleListingClosed({ tokenId: 2 });
    listing = await ResaleListing.findOne({ tokenId: 2 });
    expect(listing?.active).toBe(false);
  });
});
