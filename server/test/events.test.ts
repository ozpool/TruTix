import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { setupDb, teardownDb } from "./helpers/db";
import { organizerToken } from "./helpers/auth";
import { createApp } from "../src/app";
import { Event, ResaleListing } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

const app = createApp();

function payload(eventId: number) {
  return {
    eventId,
    name: "Launch",
    description: "desc",
    capacity: 100,
    maxResalePct: 20,
    royaltyBps: 500,
    startsAt: new Date().toISOString(),
    tierPrices: ["100"],
  };
}

describe("organizer event CRUD", () => {
  it("creates and lists the organizer's own events", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const token = await organizerToken(app, account);

    const created = await request(app)
      .post("/org/events")
      .set("Authorization", `Bearer ${token}`)
      .send(payload(1));
    expect(created.status).toBe(201);

    const list = await request(app).get("/org/events").set("Authorization", `Bearer ${token}`);
    expect(list.body.events).toHaveLength(1);
    expect(list.body.events[0].organizer).toBe(account.address.toLowerCase());
  });

  it("rejects creation without an organizer token", async () => {
    const res = await request(app).post("/org/events").send(payload(2));
    expect(res.status).toBe(401);
  });

  it("stops a different organizer from overwriting an event", async () => {
    const owner = await organizerToken(app, privateKeyToAccount(generatePrivateKey()));
    await request(app).post("/org/events").set("Authorization", `Bearer ${owner}`).send(payload(3));

    const intruder = await organizerToken(app, privateKeyToAccount(generatePrivateKey()));
    const res = await request(app)
      .post("/org/events")
      .set("Authorization", `Bearer ${intruder}`)
      .send(payload(3));
    expect(res.status).toBe(403);
  });
});

describe("public reads", () => {
  it("lists only approved events", async () => {
    await Event.create({
      ...payload(10),
      organizer: "0xabc",
      startsAt: new Date(),
      approved: false,
    });
    await Event.create({
      ...payload(11),
      organizer: "0xabc",
      startsAt: new Date(),
      approved: true,
    });

    const res = await request(app).get("/events");
    const ids = res.body.events.map((e: { eventId: number }) => e.eventId);
    expect(ids).toContain(11);
    expect(ids).not.toContain(10);
  });

  it("returns only active resale listings", async () => {
    await ResaleListing.create({
      tokenId: 50,
      eventId: 11,
      price: "100",
      seller: "0xabc",
      active: true,
      listedAt: new Date(),
    });
    await ResaleListing.create({
      tokenId: 51,
      eventId: 11,
      price: "100",
      seller: "0xabc",
      active: false,
      listedAt: new Date(),
    });

    const res = await request(app).get("/resale");
    const tokens = res.body.listings.map((l: { tokenId: number }) => l.tokenId);
    expect(tokens).toContain(50);
    expect(tokens).not.toContain(51);
  });
});
