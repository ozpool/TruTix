import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { chainId } from "../contracts";

/// Keeps the connected wallet on Base Sepolia. MetaMask tracks a network per
/// site (and can change it when accounts switch), so when the wallet reports
/// any other chain we request a switch immediately and show an alert banner
/// until the wallet is back on the right network.
export function NetworkGuard() {
  const { isConnected, chainId: current } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const wrongNetwork = isConnected && current !== undefined && current !== chainId;

  useEffect(() => {
    if (wrongNetwork) switchChain({ chainId });
  }, [wrongNetwork, switchChain]);

  if (!wrongNetwork) return null;
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 bg-rose-600 px-4 py-2 text-center text-sm font-semibold text-white"
    >
      Wrong network — TruTix runs on Base Sepolia.
      <button
        className="rounded-md bg-white/20 px-2 py-0.5 underline-offset-2 hover:bg-white/30 disabled:opacity-60"
        disabled={isPending}
        onClick={() => switchChain({ chainId })}
      >
        {isPending ? "Check MetaMask…" : "Switch network"}
      </button>
    </div>
  );
}
