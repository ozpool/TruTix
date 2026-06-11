import { type Abi, type Address } from "viem";
import { baseSepolia } from "viem/chains";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import { publicClient } from "../chain";
import { redeemerWallet } from "./wallet";
import { config } from "../config";

const abi = eventTicketAbi as Abi;
const ZERO: Address = "0x0000000000000000000000000000000000000000";

function address(): Address {
  return (config.EVENT_TICKET_ADDR ?? ZERO) as Address;
}

export async function ownerOf(tokenId: bigint): Promise<Address> {
  return (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "ownerOf",
    args: [tokenId],
  })) as Address;
}

export async function isRedeemed(tokenId: bigint): Promise<boolean> {
  return (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "isRedeemed",
    args: [tokenId],
  })) as boolean;
}

export async function ticketEvent(tokenId: bigint): Promise<bigint> {
  return (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "ticketEvent",
    args: [tokenId],
  })) as bigint;
}

/// The on-chain organizer of an event (zero address if it does not exist).
export async function eventOrganizer(eventId: bigint): Promise<Address> {
  const event = (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "events",
    args: [eventId],
  })) as { organizer: Address };
  return event.organizer;
}

/// Submit the redemption transaction via the org-authorized wallet; returns its hash.
export async function markRedeemed(tokenId: bigint): Promise<`0x${string}`> {
  const wallet = redeemerWallet();
  return wallet.writeContract({
    account: wallet.account ?? null,
    chain: baseSepolia,
    address: address(),
    abi,
    functionName: "markRedeemed",
    args: [tokenId],
  });
}
