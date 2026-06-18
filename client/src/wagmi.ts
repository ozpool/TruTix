import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/// MetaMask-only wallet config for Base Sepolia (no WalletConnect/RainbowKit).
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  // Set VITE_RPC_URL to a dedicated provider so chain reads and transaction-
  // receipt waits don't hit the rate-limited public endpoint. The app no longer
  // watches blocks from the browser (see useLiveSync), so RPC traffic is limited
  // to reads, writes and short-lived receipt polling while a tx is pending.
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_RPC_URL),
  },
});
