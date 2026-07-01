import { useQuery } from "@tanstack/react-query";
import { type Abi } from "viem";
import { readClient } from "../lib/chain";
import { eventTicket } from "../contracts";
import { type Ticket } from "./useTickets";

const abi = eventTicket.abi as Abi;
const address = eventTicket.address;
const REFETCH_MS = 15_000;

/// Read a wallet's tickets straight from the chain — the authoritative source of
/// ownership — so they appear even when the indexer cache is empty or lagging.
/// Scans tokenId 1..nextTokenId-1 via multicall (one RPC round-trip each), which
/// is fine at MVP/testnet supply. A production-scale fix would be an on-chain
/// enumerable index or a healthy indexer; this stays correct regardless.
export async function fetchOwnedTickets(owner: string): Promise<Ticket[]> {
  const target = owner.toLowerCase();
  const next = (await readClient.readContract({
    address,
    abi,
    functionName: "nextTokenId",
  })) as bigint;

  const ids: bigint[] = [];
  for (let id = 1n; id < next; id++) ids.push(id);
  if (ids.length === 0) return [];

  // ownerOf reverts for burned/nonexistent ids, so allow per-call failure.
  const owners = await readClient.multicall({
    allowFailure: true,
    contracts: ids.map((id) => ({ address, abi, functionName: "ownerOf", args: [id] })),
  });

  const mine = ids.filter((_, i) => {
    const r = owners[i];
    if (!r || r.status !== "success") return false;
    return String(r.result).toLowerCase() === target;
  });
  if (mine.length === 0) return [];

  const details = await readClient.multicall({
    allowFailure: false,
    contracts: mine.flatMap((id) => [
      { address, abi, functionName: "ticketEvent", args: [id] },
      { address, abi, functionName: "ticketTier", args: [id] },
      { address, abi, functionName: "ticketSeat", args: [id] },
    ]),
  });

  return mine.map((id, i) => ({
    tokenId: Number(id),
    eventId: Number(details[i * 3] as bigint),
    owner: target,
    tier: Number(details[i * 3 + 1] as bigint),
    seat: Number(details[i * 3 + 2] as bigint),
  }));
}

/// Live on-chain ticket list for a wallet. Polls so a fresh mint or an incoming
/// transfer surfaces without a reload.
export function useOwnedTickets(owner: string | undefined) {
  return useQuery({
    queryKey: ["owned-tickets", owner?.toLowerCase()],
    queryFn: () => fetchOwnedTickets(owner as string),
    enabled: Boolean(owner),
    refetchInterval: REFETCH_MS,
  });
}
