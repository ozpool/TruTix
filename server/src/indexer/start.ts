import { type Abi, type Address } from "viem";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import marketplaceAbi from "@trutix/shared/abis/TicketMarketplace.json";
import { publicClient } from "../chain";
import { config } from "../config";
import { handleMinted, handleTransfer, handleListed, handleListingClosed } from "./handlers";

const ZERO = "0x0000000000000000000000000000000000000000";

type EventArgs = Record<string, unknown>;
const argsOf = (log: unknown): EventArgs => (log as { args: EventArgs }).args;
const num = (value: unknown): number => Number(value);
const str = (value: unknown): string => String(value);

/// Subscribe to contract events and keep the owner/listing caches in sync.
/// No-op when contract addresses are not configured (e.g. local tests).
export function startIndexer(): void {
  const eventTicket = config.EVENT_TICKET_ADDR as Address | undefined;
  const marketplace = config.MARKETPLACE_ADDR as Address | undefined;
  if (!eventTicket || !marketplace) {
    console.warn("Indexer disabled: contract addresses are not configured");
    return;
  }

  const ticketAbi = eventTicketAbi as Abi;
  const mktAbi = marketplaceAbi as Abi;

  publicClient.watchContractEvent({
    address: eventTicket,
    abi: ticketAbi,
    eventName: "TicketMinted",
    onLogs: (logs) => {
      for (const log of logs) {
        const a = argsOf(log);
        void handleMinted({
          tokenId: num(a.tokenId),
          eventId: num(a.eventId),
          to: str(a.to),
          tier: num(a.tier),
          seat: num(a.seat),
        });
      }
    },
  });

  publicClient.watchContractEvent({
    address: eventTicket,
    abi: ticketAbi,
    eventName: "Transfer",
    onLogs: (logs) => {
      for (const log of logs) {
        const a = argsOf(log);
        if (str(a.from) === ZERO) continue; // mints are handled by TicketMinted
        void handleTransfer({ tokenId: num(a.tokenId), to: str(a.to) });
      }
    },
  });

  publicClient.watchContractEvent({
    address: marketplace,
    abi: mktAbi,
    eventName: "Listed",
    onLogs: (logs) => {
      for (const log of logs) {
        const a = argsOf(log);
        void handleListed({ tokenId: num(a.tokenId), seller: str(a.seller), price: str(a.price) });
      }
    },
  });

  for (const eventName of ["Sold", "Cancelled"] as const) {
    publicClient.watchContractEvent({
      address: marketplace,
      abi: mktAbi,
      eventName,
      onLogs: (logs) => {
        for (const log of logs) {
          void handleListingClosed({ tokenId: num(argsOf(log).tokenId) });
        }
      },
    });
  }
}
