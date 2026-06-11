import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { SiweMessage } from "siwe";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { setupDb, teardownDb } from "./helpers/db";
import { createApp } from "../src/app";

beforeAll(setupDb);
afterAll(teardownDb);

const app = createApp();

async function buildSignedMessage(account: PrivateKeyAccount, nonce: string) {
  const siwe = new SiweMessage({
    domain: "localhost",
    address: account.address,
    statement: "Sign in to TruTix",
    uri: "http://localhost",
    version: "1",
    chainId: 84532,
    nonce,
  });
  const message = siwe.prepareMessage();
  const signature = await account.signMessage({ message });
  return { message, signature };
}

describe("organizer SIWE auth", () => {
  it("issues a JWT for a valid signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const { body } = await request(app).get("/auth/nonce");
    const { message, signature } = await buildSignedMessage(account, body.nonce);

    const res = await request(app).post("/auth/verify").send({ message, signature });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.address).toBe(account.address.toLowerCase());
  });

  it("rejects a tampered signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const { body } = await request(app).get("/auth/nonce");
    const { message } = await buildSignedMessage(account, body.nonce);

    const res = await request(app).post("/auth/verify").send({ message, signature: "0xdeadbeef" });
    expect(res.status).toBe(401);
  });

  it("rejects a replayed nonce", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const { body } = await request(app).get("/auth/nonce");
    const { message, signature } = await buildSignedMessage(account, body.nonce);

    const first = await request(app).post("/auth/verify").send({ message, signature });
    expect(first.status).toBe(200);
    const second = await request(app).post("/auth/verify").send({ message, signature });
    expect(second.status).toBe(401);
  });

  it("rejects a message signed for a different domain", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const { body } = await request(app).get("/auth/nonce");
    const siwe = new SiweMessage({
      domain: "evil.example",
      address: account.address,
      uri: "http://evil.example",
      version: "1",
      chainId: 84532,
      nonce: body.nonce,
    });
    const message = siwe.prepareMessage();
    const signature = await account.signMessage({ message });

    const res = await request(app).post("/auth/verify").send({ message, signature });
    expect(res.status).toBe(401);
  });
});
