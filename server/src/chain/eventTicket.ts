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
/// The public `events` getter returns the struct as a flat tuple:
/// [name, capacity, maxResalePct, royaltyBps, organizer, startsAt, exists].
export async function eventOrganizer(eventId: bigint): Promise<Address> {
  const event = (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "events",
    args: [eventId],
  })) as readonly unknown[];
  return event[4] as Address;
}

export interface OnChainEvent {
  name: string;
  capacity: number;
  maxResalePct: number;
  royaltyBps: number;
  organizer: Address;
  startsAt: number;
}

/// The full on-chain terms of an event, parsed from the flat getter tuple.
export async function eventInfo(eventId: bigint): Promise<OnChainEvent> {
  const e = (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "events",
    args: [eventId],
  })) as readonly [string, bigint, bigint, bigint, Address, bigint, boolean];
  return {
    name: e[0],
    capacity: Number(e[1]),
    maxResalePct: Number(e[2]),
    royaltyBps: Number(e[3]),
    organizer: e[4],
    startsAt: Number(e[5]),
  };
}

export async function tierPrices(eventId: bigint): Promise<string[]> {
  const prices = (await publicClient.readContract({
    address: address(),
    abi,
    functionName: "tierPrices",
    args: [eventId],
  })) as readonly bigint[];
  return prices.map((p) => p.toString());
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
