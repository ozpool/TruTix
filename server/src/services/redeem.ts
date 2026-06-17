import { markRedeemed } from "../chain/eventTicket";
import { RedemptionLog } from "../models";

export interface RedeemInput {
  tokenId: number;
  eventId: number;
  staffId: string;
  owner?: string;
}

/// Submit markRedeemed on-chain and record the redemption. The on-chain flag is
/// one-way, so the contract is the source of truth; this also logs who scanned,
/// which holder was admitted, and the tx, for the staff redemption history.
export async function redeemTicket(input: RedeemInput): Promise<{ txHash: string }> {
  const txHash = await markRedeemed(BigInt(input.tokenId));
  await RedemptionLog.create({
    tokenId: input.tokenId,
    eventId: input.eventId,
    staffId: input.staffId,
    owner: input.owner ?? "",
    txHash,
    redeemedAt: new Date(),
  });
  return { txHash };
}
