import { type ReactNode } from "react";
import { useAccount } from "wagmi";

/// Gate attendee routes behind a connected wallet.
export function RequireWallet({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <p className="text-slate-300">Connect your wallet to continue.</p>;
  }
  return <>{children}</>;
}
