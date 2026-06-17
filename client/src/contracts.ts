import { type Abi } from "viem";
import { baseSepolia } from "wagmi/chains";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import marketplaceAbi from "@trutix/shared/abis/TicketMarketplace.json";

/// Every contract write pins this chain so the wallet is prompted to switch
/// networks instead of sending the call into whatever chain it is on.
export const chainId = baseSepolia.id;

export const eventTicket = {
  address: import.meta.env.VITE_EVENT_TICKET_ADDR as `0x${string}`,
  abi: eventTicketAbi as Abi,
} as const;

export const marketplace = {
  address: import.meta.env.VITE_MARKETPLACE_ADDR as `0x${string}`,
  abi: marketplaceAbi as Abi,
} as const;
