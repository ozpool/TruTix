import { createWalletClient, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { config } from "../config";

/// Address of the redeemer wallet, or null when no key is configured.
/// Organizers grant this address the per-event redeemer role on-chain.
export function redeemerAddress(): string | null {
  if (!config.BACKEND_PRIVATE_KEY) return null;
  return privateKeyToAccount(config.BACKEND_PRIVATE_KEY as `0x${string}`).address;
}

/// The org-authorized wallet that submits redemption transactions.
export function redeemerWallet(): WalletClient {
  if (!config.BACKEND_PRIVATE_KEY) {
    throw new Error("BACKEND_PRIVATE_KEY is not configured");
  }
  const account = privateKeyToAccount(config.BACKEND_PRIVATE_KEY as `0x${string}`);
  return createWalletClient({ account, chain: baseSepolia, transport: http(config.RPC_URL) });
}
