import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/// MetaMask-only wallet config for Base Sepolia (no WalletConnect/RainbowKit).
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_RPC_URL),
  },
});
