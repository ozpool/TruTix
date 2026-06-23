import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatAddress } from "../lib/format";
import { Button } from "./ui/Button";

/// True when a browser wallet (e.g. MetaMask) has injected a provider. Lets us
/// give a clear "install a wallet" message instead of a click that does nothing.
function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
}

/// Wallet connect / account menu. Disconnected: a single connect button.
/// Connected: an address pill that opens a small menu so disconnecting is a
/// deliberate choice (not a stray click) and the address can be copied.
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isConnected || !address) {
    const noWallet = !hasInjectedWallet();
    const onConnect = () => {
      setNotice(null);
      if (noWallet) {
        setNotice("No wallet detected. Install MetaMask to connect.");
        return;
      }
      connect(
        { connector: injected() },
        {
          onError: (err) =>
            setNotice(
              err.name === "UserRejectedRequestError"
                ? "Connection request rejected. Approve it in your wallet to continue."
                : "Couldn't connect to your wallet. Please try again.",
            ),
        },
      );
    };

    return (
      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setNotice(null);
        }}
      >
        <Button size="sm" onClick={onConnect} loading={isPending}>
          {isPending ? "Connecting…" : "Connect Wallet"}
        </Button>
        {notice && (
          <div
            role="alert"
            className="absolute right-0 top-11 z-40 w-60 animate-pop-in rounded-xl border border-ink-600 bg-ink-900 p-3 text-sm shadow-lg"
          >
            <p className="text-slate-200">{notice}</p>
            {noWallet && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-semibold text-citrus-400 hover:underline"
              >
                Get MetaMask →
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  async function copy() {
    await navigator.clipboard?.writeText(address ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-citrus-400" aria-hidden="true" />
        <span className="font-mono">{formatAddress(address)}</span>
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-xl border border-ink-600 bg-ink-900 py-1 shadow-lg"
        >
          <button
            role="menuitem"
            onClick={() => void copy()}
            className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-ink-800"
          >
            {copied ? "Copied ✓" : "Copy address"}
          </button>
          <button
            role="menuitem"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-ink-800"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
