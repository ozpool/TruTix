import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import * as wallet from "../src/chain/wallet";

vi.mock("../src/chain/wallet", () => ({
  redeemerAddress: vi.fn(),
  redeemerWallet: vi.fn(),
}));
const mocked = vi.mocked(wallet);

const app = createApp();

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /org/redeemer", () => {
  it("returns 503 when no redeemer wallet is configured", async () => {
    mocked.redeemerAddress.mockReturnValue(null);

    const res = await request(app).get("/org/redeemer");
    expect(res.status).toBe(503);
  });

  it("returns the redeemer wallet address without auth", async () => {
    mocked.redeemerAddress.mockReturnValue("0x1111111111111111111111111111111111111111");

    const res = await request(app).get("/org/redeemer");
    expect(res.status).toBe(200);
    expect(res.body.address).toBe("0x1111111111111111111111111111111111111111");
  });
});
