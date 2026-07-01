import { useOwnedTickets } from "./useOwnedTickets";
import { useTickets, type Ticket } from "./useTickets";

/// On-chain ownership is the source of truth; the indexer API is a fast cache.
/// A ticket shows if EITHER source has it, with the on-chain record winning on
/// conflicts — so My Tickets stays correct even when the indexer lags or is down.
export function mergeTickets(chain: Ticket[], api: Ticket[]): Ticket[] {
  const byId = new Map<number, Ticket>();
  for (const t of api) byId.set(t.tokenId, t);
  for (const t of chain) byId.set(t.tokenId, t); // chain overwrites the cache
  return [...byId.values()].sort((a, b) => a.tokenId - b.tokenId);
}

export interface MyTicketsState {
  tickets: Ticket[];
  isLoading: boolean;
  isError: boolean;
  /// Chain read failed but cached rows are showing — data may be out of date.
  staleFromCache: boolean;
  refetch: () => void;
}

/// Combine the on-chain read and the cached API list into one resilient source
/// for the My Tickets screen, exposing precise loading / error / degraded states.
export function useMyTickets(owner: string | undefined): MyTicketsState {
  const chain = useOwnedTickets(owner);
  const api = useTickets(owner);

  const tickets = mergeTickets(chain.data ?? [], api.data ?? []);

  return {
    tickets,
    // Loading only while we still have nothing to show.
    isLoading: tickets.length === 0 && (chain.isLoading || api.isLoading),
    // Hard error only when BOTH sources failed — otherwise show what we have.
    isError: chain.isError && api.isError,
    staleFromCache: chain.isError && !api.isError && tickets.length > 0,
    refetch: () => {
      void chain.refetch();
      void api.refetch();
    },
  };
}
