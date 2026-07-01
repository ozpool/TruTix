import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/// A read-only viem client pinned to Base Sepolia, independent of the wallet's
/// currently selected network. Used for direct on-chain reads (e.g. ownership)
/// so the UI reflects chain truth even when the indexer cache is stale/down or
/// the wallet is momentarily on the wrong network. Point VITE_RPC_URL at a
/// dedicated provider (e.g. Alchemy) so these reads don't hit the rate-limited
/// public endpoint.
export const readClient = createPublicClient({
  chain: baseSepolia,
  transport: http(import.meta.env.VITE_RPC_URL),
});
