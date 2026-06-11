import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

const buttonClass =
  "rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button className={buttonClass} onClick={() => disconnect()}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button className={buttonClass} onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </button>
  );
}
