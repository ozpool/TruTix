import {
  handleEventCreated,
  handleMinted,
  handleTransfer,
  handleListed,
  handleListingClosed,
} from "./handlers";

const ZERO = "0x0000000000000000000000000000000000000000";

type EventArgs = Record<string, unknown>;
const num = (value: unknown): number => Number(value);
const str = (value: unknown): string => String(value);

/// Route one decoded contract log to its cache handler. Shared by the boot
/// catch-up and the live poll so both paths stay in exact agreement.
export async function dispatch(eventName: string, args: EventArgs): Promise<void> {
  switch (eventName) {
    case "EventCreated":
      return handleEventCreated({ eventId: num(args.eventId) });
    case "TicketMinted":
      return handleMinted({
        tokenId: num(args.tokenId),
        eventId: num(args.eventId),
        to: str(args.to),
        tier: num(args.tier),
        seat: num(args.seat),
      });
    case "Transfer":
      if (str(args.from) === ZERO) return; // mints are covered by TicketMinted
      return handleTransfer({ tokenId: num(args.tokenId), to: str(args.to) });
    case "Listed":
      return handleListed({
        tokenId: num(args.tokenId),
        seller: str(args.seller),
        price: str(args.price),
      });
    case "Sold":
    case "Cancelled":
      return handleListingClosed({ tokenId: num(args.tokenId) });
  }
}
