import { markRedeemed } from "../chain/eventTicket";
import { RedemptionLog } from "../models";

export interface RedeemInput {
  tokenId: number;
  eventId: number;
  staffId: string;
}

/// Submit markRedeemed on-chain and record the redemption. The on-chain flag is
/// one-way, so the contract is the source of truth; this also logs who scanned.
export async function redeemTicket(input: RedeemInput): Promise<{ txHash: string }> {
  const txHash = await markRedeemed(BigInt(input.tokenId));
  await RedemptionLog.create({
    tokenId: input.tokenId,
    eventId: input.eventId,
    staffId: input.staffId,
    txHash,
    redeemedAt: new Date(),
  });
  return { txHash };
}
