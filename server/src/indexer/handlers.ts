import { TicketOwner, ResaleListing, Event } from "../models";
import { eventInfo, tierPrices } from "../chain/eventTicket";

/// An event was created on-chain: cache its terms so it is visible even when
/// the organizer's off-chain metadata save fails (expired session, API down).
/// Only chain-derived fields are written; description/heroImage stay intact.
export async function handleEventCreated(args: { eventId: number }): Promise<void> {
  const id = BigInt(args.eventId);
  const [info, prices] = await Promise.all([eventInfo(id), tierPrices(id)]);
  await Event.findOneAndUpdate(
    { eventId: args.eventId },
    {
      eventId: args.eventId,
      name: info.name,
      capacity: info.capacity,
      maxResalePct: info.maxResalePct,
      royaltyBps: info.royaltyBps,
      startsAt: new Date(info.startsAt * 1000),
      tierPrices: prices,
      organizer: info.organizer.toLowerCase(),
      approved: true,
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

/// A new ticket was minted: record its owner, event, tier and seat.
export async function handleMinted(args: {
  tokenId: number;
  eventId: number;
  to: string;
  tier: number;
  seat: number;
}): Promise<void> {
  await TicketOwner.findOneAndUpdate(
    { tokenId: args.tokenId },
    {
      tokenId: args.tokenId,
      eventId: args.eventId,
      owner: args.to.toLowerCase(),
      tier: args.tier,
      seat: args.seat,
    },
    { upsert: true },
  );
}

/// A ticket changed hands (resale/transfer): update the cached owner.
export async function handleTransfer(args: { tokenId: number; to: string }): Promise<void> {
  await TicketOwner.updateOne({ tokenId: args.tokenId }, { owner: args.to.toLowerCase() });
}

/// A ticket was listed for resale: upsert an active listing.
export async function handleListed(args: {
  tokenId: number;
  seller: string;
  price: string;
}): Promise<void> {
  const owner = await TicketOwner.findOne({ tokenId: args.tokenId });
  await ResaleListing.findOneAndUpdate(
    { tokenId: args.tokenId },
    {
      tokenId: args.tokenId,
      eventId: owner?.eventId ?? 0,
      price: args.price,
      seller: args.seller.toLowerCase(),
      active: true,
      listedAt: new Date(),
    },
    { upsert: true },
  );
}

/// A listing was sold or cancelled: deactivate it.
export async function handleListingClosed(args: { tokenId: number }): Promise<void> {
  await ResaleListing.updateOne({ tokenId: args.tokenId }, { active: false });
}
