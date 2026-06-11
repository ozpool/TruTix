import request from "supertest";
import type { Express } from "express";
import { SiweMessage } from "siwe";
import { type PrivateKeyAccount } from "viem/accounts";

/// Drive the SIWE flow and return an organizer JWT (for tests).
export async function organizerToken(app: Express, account: PrivateKeyAccount): Promise<string> {
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
