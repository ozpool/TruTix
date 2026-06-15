import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "./ui/Button";

/// Wallet connect / address pill. When connected, shows a truncated address with
/// a live status dot; clicking disconnects.
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        aria-label={`Connected as ${address}. Disconnect.`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-citrus-400" aria-hidden="true" />
        <span className="font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </Button>
  );
}
