import { type Abi, type Address } from "viem";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import { publicClient } from "../chain";
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
