import { useQuery } from "@tanstack/react-query";
import { type Abi } from "viem";
import { readClient } from "../lib/chain";
import { eventTicket, marketplace } from "../contracts";
import { type Listing } from "./useResale";

const ticketAbi = eventTicket.abi as Abi;
const ticketAddress = eventTicket.address;
const mktAbi = marketplace.abi as Abi;
const mktAddress = marketplace.address;
const ZERO = "0x0000000000000000000000000000000000000000";
const REFETCH_MS = 15_000;

/// Read every active resale listing straight from the marketplace contract —
/// the authoritative source — so the board is correct even when the indexer
/// cache is empty, lagging, or still showing a listing that was since
/// cancelled or sold. Scans tokenId 1..nextTokenId-1 via multicall (one
/// RPC round-trip each), fine at MVP/testnet supply; see useOwnedTickets for
/// the same tradeoff and its production-scale note.
export async function fetchOnChainListings(): Promise<Listing[]> {
  const next = (await readClient.readContract({
    address: ticketAddress,
    abi: ticketAbi,
    functionName: "nextTokenId",
  })) as bigint;

  const ids: bigint[] = [];
  for (let id = 1n; id < next; id++) ids.push(id);
  if (ids.length === 0) return [];

  // The `listings` mapping getter never reverts (it returns a zeroed struct
  // for an unlisted id), so a plain multicall with no per-call failure is safe.
  const raw = await readClient.multicall({
    allowFailure: false,
    contracts: ids.map((id) => ({
      address: mktAddress,
      abi: mktAbi,
      functionName: "listings",
      args: [id],
    })),
  });

  const active = ids
    .map((id, i) => ({ id, listing: raw[i] as unknown as readonly [bigint, string, bigint] }))
    .filter(({ listing }) => listing[1].toLowerCase() !== ZERO);
  if (active.length === 0) return [];

  // A listed ticket is never burned by this contract, so ticketEvent cannot
  // revert here either.
  const eventIds = await readClient.multicall({
    allowFailure: false,
    contracts: active.map(({ id }) => ({
      address: ticketAddress,
      abi: ticketAbi,
      functionName: "ticketEvent",
      args: [id],
    })),
  });

  return active.map(({ id, listing }, i) => ({
    tokenId: Number(id),
    eventId: Number(eventIds[i] as bigint),
    price: (listing[0] as bigint).toString(),
    seller: listing[1] as string,
  }));
}

/// Live on-chain resale board. Polls so a listing, sale, or cancel from
/// another wallet surfaces without a reload.
export function useOnChainListings() {
  return useQuery({
    queryKey: ["on-chain-listings"],
    queryFn: fetchOnChainListings,
    refetchInterval: REFETCH_MS,
  });
}
