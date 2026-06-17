import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { verifyTicket, gateMessage } from "../src/services/verify";
import * as ticket from "../src/chain/eventTicket";
import { createApp } from "../src/app";

vi.mock("../src/chain/eventTicket", () => ({
  ownerOf: vi.fn(),
  isRedeemed: vi.fn(),
  ticketEvent: vi.fn(),
}));

const chain = vi.mocked(ticket);

async function signedQr(tokenId: number, timestamp: number) {
  const account = privateKeyToAccount(generatePrivateKey());
  const signature = await account.signMessage({ message: gateMessage(tokenId, timestamp) });
  return { account, signature };
}

const NOW = 1_000_000;

describe("verifyTicket", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("is valid for a fresh QR from the owner of an unredeemed ticket", async () => {
    const { account, signature } = await signedQr(1, NOW);
    chain.ticketEvent.mockResolvedValue(7n);
    chain.ownerOf.mockResolvedValue(account.address);
    chain.isRedeemed.mockResolvedValue(false);

    const result = await verifyTicket({
      tokenId: 1,
      timestamp: NOW,
      signature,
      staffEventId: 7,
      now: NOW,
    });
    expect(result.state).toBe("valid");
  });

  it("is stale for an old timestamp", async () => {
    const old = NOW - 601_000;
    const { signature } = await signedQr(1, old);
    const result = await verifyTicket({
      tokenId: 1,
      timestamp: old,
      signature,
      staffEventId: 7,
      now: NOW,
    });
    expect(result.state).toBe("stale");
  });

  it("is wrong_event when the ticket's event differs from the staff scope", async () => {
    const { signature } = await signedQr(1, NOW);
    chain.ticketEvent.mockResolvedValue(9n);
    const result = await verifyTicket({
      tokenId: 1,
      timestamp: NOW,
      signature,
      staffEventId: 7,
      now: NOW,
    });
    expect(result.state).toBe("wrong_event");
  });

  it("is not_owner when the signer does not own the ticket", async () => {
    const { signature } = await signedQr(1, NOW);
    chain.ticketEvent.mockResolvedValue(7n);
    chain.ownerOf.mockResolvedValue("0x000000000000000000000000000000000000dEaD");
    const result = await verifyTicket({
      tokenId: 1,
      timestamp: NOW,
      signature,
      staffEventId: 7,
      now: NOW,
    });
    expect(result.state).toBe("not_owner");
  });

  it("is already_redeemed when the ticket is used", async () => {
    const { account, signature } = await signedQr(1, NOW);
    chain.ticketEvent.mockResolvedValue(7n);
    chain.ownerOf.mockResolvedValue(account.address);
    chain.isRedeemed.mockResolvedValue(true);
    const result = await verifyTicket({
      tokenId: 1,
      timestamp: NOW,
      signature,
      staffEventId: 7,
      now: NOW,
    });
    expect(result.state).toBe("already_redeemed");
  });
});

describe("POST /verify", () => {
  it("requires a staff token", async () => {
    const res = await request(createApp())
      .post("/verify")
      .send({ tokenId: 1, timestamp: NOW, signature: "0xabc" });
    expect(res.status).toBe(401);
  });
});
