import { useEffect, useRef } from "react";
import { useBlockNumber } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

/// Query keys whose data is derived from on-chain state via the indexer cache.
const CHAIN_DERIVED_KEYS = [["events"], ["event"], ["tickets"], ["resale"], ["scan-history"]];

/// Marks the chain-derived caches stale on every new block so any mounted list
/// refetches in step with the chain — this is what makes mints, transfers,
/// listings and redemptions appear without a manual reload. wagmi's block watch
/// uses the RPC subscription where available and falls back to polling, so the
/// per-query refetchInterval stays as a backstop if the subscription drops.
export function useLiveSync() {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const queryClient = useQueryClient();
  const lastBlock = useRef<bigint | null>(null);

  useEffect(() => {
    if (blockNumber === undefined || blockNumber === lastBlock.current) return;
    lastBlock.current = blockNumber;
    for (const key of CHAIN_DERIVED_KEYS) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }, [blockNumber, queryClient]);
}
