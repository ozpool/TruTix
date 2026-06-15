import { type ReactNode } from "react";
import { useAccount } from "wagmi";
import { EmptyState } from "./ui/EmptyState";
import { TicketIcon } from "./ui/icons";

/// Gate attendee routes behind a connected wallet.
export function RequireWallet({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <EmptyState
        icon={<TicketIcon className="h-8 w-8" />}
        title="Connect your wallet to continue"
        hint="Use the Connect Wallet button in the top bar to view your tickets."
      />
    );
  }
  return <>{children}</>;
}
