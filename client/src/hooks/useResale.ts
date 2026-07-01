import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useOnChainListings } from "./useOnChainListings";

export interface Listing {
  tokenId: number;
  eventId: number;
  price: string;
  seller: string;
}

function useApiListings() {
  return useQuery({
    queryKey: ["resale"],
    queryFn: () => apiGet<{ listings: Listing[] }>("/resale").then((r) => r.listings),
    // Poll so listings, sales and cancels from other wallets surface live.
    refetchInterval: 15_000,
  });
}

/// Unlike ticket ownership, a successful on-chain listings read is already a
/// complete answer (it scans every token, not a filtered subset), so there is
/// no gap to fill from the cache — only cancelled/sold listings to correctly
/// drop. Fall back to the indexer-backed cache only if the chain read itself
/// failed (RPC down/rate-limited), not merge it in.
export function pickListings(
  chain: { isSuccess: boolean; data?: Listing[] },
  api: { data?: Listing[] },
): Listing[] | undefined {
  return chain.isSuccess ? chain.data : api.data;
}

/// Active resale listings, read straight from the marketplace contract so the
/// board stays correct even when the indexer cache is stale or down.
export function useResale() {
  const chain = useOnChainListings();
  const api = useApiListings();
  const data = pickListings(chain, api);

  return {
    data,
    isLoading: data === undefined && (chain.isLoading || api.isLoading),
    isError: data === undefined && chain.isError && api.isError,
    refetch: () => {
      void chain.refetch();
      void api.refetch();
    },
  };
}
