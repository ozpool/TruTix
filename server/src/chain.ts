import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "./config";

/// Read-only client for on-chain lookups (ownerOf, isRedeemed, etc.).
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.RPC_URL),
});
