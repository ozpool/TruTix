import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupDb, teardownDb } from "./helpers/db";
import { Event, ResaleListing } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

describe("Event model", () => {
  it("saves an event and applies defaults", async () => {
    const ev = await Event.create({
      eventId: 1,
      name: "Demo",
      organizer: "0xAbC123",
      capacity: 100,
      maxResalePct: 20,
      royaltyBps: 500,
      startsAt: new Date(),
    });

    expect(ev.eventId).toBe(1);
    expect(ev.approved).toBe(false);
    expect(ev.organizer).toBe("0xabc123"); // lowercased
    const found = await Event.findOne({ eventId: 1 });
    expect(found?.name).toBe("Demo");
  });

  it("requires the core fields", async () => {
    await expect(Event.create({ name: "missing the rest" })).rejects.toThrow();
  });
});

describe("ResaleListing model", () => {
  it("stores a listing keyed by tokenId", async () => {
    await ResaleListing.create({
      tokenId: 7,
      eventId: 1,
      price: "100000000000000000",
      seller: "0xSeller",
      listedAt: new Date(),
    });

    const found = await ResaleListing.findOne({ tokenId: 7 });
    expect(found?.active).toBe(true);
    expect(found?.seller).toBe("0xseller");
  });
});
