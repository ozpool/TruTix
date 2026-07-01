import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/// Query keys whose data is served by the API from the indexer's cache.
const CHAIN_DERIVED_KEYS = [
  ["events"],
  ["event"],
  ["tickets"],
  ["owned-tickets"],
  ["resale"],
  ["scan-history"],
];

/// How often to re-pull the cached lists from the API. The server-side indexer
/// is the only thing that watches the chain; the client just re-reads its cache
/// on this interval so mints, transfers, listings and redemptions surface within
/// a few seconds. Action handlers (e.g. a scan) invalidate immediately on top of
/// this for instant feedback.
const REFRESH_MS = 20_000;

/// Periodically marks the chain-derived caches stale so any mounted list refetches
/// from the API. Deliberately does not watch the chain from the browser — that
/// would poll the RPC on every block for every open tab; the indexer already
/// tracks the chain server-side and keeps the cache current.
export function useLiveSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = setInterval(() => {
      for (const key of CHAIN_DERIVED_KEYS) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [queryClient]);
}
