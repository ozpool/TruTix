import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { SiweMessage } from "siwe";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { setupDb, teardownDb } from "./helpers/db";
import { createApp } from "../src/app";
import { requireStaff, type StaffRequest } from "../src/auth/middleware";
import { eventOrganizer } from "../src/chain/eventTicket";

vi.mock("../src/chain/eventTicket", () => ({
  eventOrganizer: vi.fn(),
}));

beforeAll(setupDb);
afterAll(teardownDb);

const app = createApp();

async function organizerToken(account: PrivateKeyAccount): Promise<string> {
  const { body } = await request(app).get("/auth/nonce");
  const siwe = new SiweMessage({
    domain: "localhost",
    address: account.address,
    uri: "http://localhost",
    version: "1",
    chainId: 84532,
    nonce: body.nonce,
  });
  const message = siwe.prepareMessage();
  const signature = await account.signMessage({ message });
  const res = await request(app).post("/auth/verify").send({ message, signature });
  return res.body.token;
}

function staffApp() {
  const a = express();
  a.get("/whoami", requireStaff, (req: StaffRequest, res) => {
    res.json(req.staff);
  });
  return a;
}

describe("staff accounts and tokens", () => {
  it("lets an organizer create staff and issues a scoped token", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    vi.mocked(eventOrganizer).mockResolvedValue(account.address);
    const token = await organizerToken(account);
    const res = await request(app)
      .post("/org/staff")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 1, venue: "Main Gate", label: "Sam" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.staffId).toBeTypeOf("string");
  });

  it("rejects staff creation without an organizer token", async () => {
    const res = await request(app).post("/org/staff").send({ eventId: 1, venue: "Main Gate" });
    expect(res.status).toBe(401);
  });

  it("rejects an organizer who does not own the event on-chain", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const someoneElse = privateKeyToAccount(generatePrivateKey());
    vi.mocked(eventOrganizer).mockResolvedValue(someoneElse.address);
    const token = await organizerToken(account);
    const res = await request(app)
      .post("/org/staff")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: 99, venue: "Main Gate" });

    expect(res.status).toBe(403);
  });
});

describe("requireStaff middleware", () => {
  it("accepts a valid staff token and exposes its scope", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    vi.mocked(eventOrganizer).mockResolvedValue(account.address);
    const orgToken = await organizerToken(account);
    const created = await request(app)
      .post("/org/staff")
      .set("Authorization", `Bearer ${orgToken}`)
      .send({ eventId: 5, venue: "Side Door" });

    const res = await request(staffApp())
      .get("/whoami")
      .set("Authorization", `Bearer ${created.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.eventId).toBe(5);
    expect(res.body.venue).toBe("Side Door");
  });

  it("rejects a missing token", async () => {
    const res = await request(staffApp()).get("/whoami");
    expect(res.status).toBe(401);
  });
});
