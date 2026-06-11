import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupDb, teardownDb } from "./helpers/db";
import { createApp } from "../src/app";
import { TicketOwner } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

const app = createApp();

const ALICE = "0x1111111111111111111111111111111111111111";
const BOB = "0x2222222222222222222222222222222222222222";

describe("GET /tickets", () => {
  it("lists tickets owned by an address", async () => {
    await TicketOwner.create({ tokenId: 1, eventId: 7, owner: ALICE, tier: 0, seat: 1 });
    await TicketOwner.create({ tokenId: 2, eventId: 7, owner: BOB, tier: 0, seat: 2 });

    const res = await request(app).get(`/tickets?owner=${ALICE.toUpperCase().replace("0X", "0x")}`);
    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].tokenId).toBe(1);
  });

  it("rejects a malformed owner address", async () => {
    const res = await request(app).get("/tickets?owner=nope");
    expect(res.status).toBe(400);
  });
});
