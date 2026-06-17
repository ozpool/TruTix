import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "./ui/Button";

/// Wallet connect / account menu. Disconnected: a single connect button.
/// Connected: an address pill that opens a small menu so disconnecting is a
/// deliberate choice (not a stray click) and the address can be copied.
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return (
      <Button size="sm" onClick={() => connect({ connector: injected() })}>
        Connect Wallet
      </Button>
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
        <span className="font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
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
