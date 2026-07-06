import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "./config";
import type { publicClient } from "./chain";

/// Optional deep-history client for indexer catch-up (e.g. Envio HyperRPC).
/// Undefined when INDEXER_BACKFILL_RPC_URL is not set — backfill is then a no-op.
export const backfillClient: typeof publicClient | undefined = config.INDEXER_BACKFILL_RPC_URL
  ? createPublicClient({
      chain: baseSepolia,
      transport: http(config.INDEXER_BACKFILL_RPC_URL),
    })
  : undefined;
