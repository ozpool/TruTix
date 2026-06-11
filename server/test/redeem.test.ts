import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { setupDb, teardownDb } from "./helpers/db";
import { redeemTicket } from "../src/services/redeem";
import * as ticket from "../src/chain/eventTicket";
import { RedemptionLog } from "../src/models";

vi.mock("../src/chain/eventTicket", () => ({ markRedeemed: vi.fn() }));
const chain = vi.mocked(ticket);

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(() => {
  vi.resetAllMocks();
});

describe("redeemTicket", () => {
  it("submits markRedeemed and records the redemption", async () => {
    chain.markRedeemed.mockResolvedValue("0xhash");

    const { txHash } = await redeemTicket({ tokenId: 1, eventId: 7, staffId: "staff-1" });
    expect(txHash).toBe("0xhash");

    const log = await RedemptionLog.findOne({ tokenId: 1 });
    expect(log?.staffId).toBe("staff-1");
    expect(log?.txHash).toBe("0xhash");
  });

  it("propagates a tx failure without logging a redemption", async () => {
    chain.markRedeemed.mockRejectedValue(new Error("reverted"));

    await expect(redeemTicket({ tokenId: 2, eventId: 7, staffId: "staff-1" })).rejects.toThrow();
    expect(await RedemptionLog.findOne({ tokenId: 2 })).toBeNull();
  });
});
