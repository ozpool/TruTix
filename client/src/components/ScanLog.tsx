import { type Redemption } from "../hooks/useRedemptions";
import { formatAddress, formatTime } from "../lib/format";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { CheckIcon } from "./ui/icons";

const EXPLORER = "https://sepolia.basescan.org/tx";

/// The list of holders already admitted at this gate, newest first. Shown to
/// staff so they can see exactly who they have scanned in, with the wallet,
/// ticket, time, and a link to the on-chain redemption tx.
export function ScanLog({ redemptions }: { redemptions: Redemption[] | undefined }) {
  if (!redemptions) return null;

  if (redemptions.length === 0) {
    return (
      <EmptyState
        icon={<CheckIcon className="h-7 w-7" />}
        title="No one scanned in yet"
        hint="Each admitted attendee will appear here as you scan."
      />
    );
  }

  return (
    <Card className="divide-y divide-ink-700/70 p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-base">You admitted ({redemptions.length})</h2>
        <span className="text-xs text-slate-500">Newest first</span>
      </div>
      <ul className="divide-y divide-ink-800">
        {redemptions.map((r) => (
          <li
            key={`${r.tokenId}-${r.txHash || r.redeemedAt}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <CheckIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-medium">Ticket #{r.tokenId}</p>
                <p className="truncate font-mono text-xs text-slate-400">
                  {formatAddress(r.owner)}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-400">{formatTime(r.redeemedAt)}</p>
              {r.txHash && (
                <a
                  href={`${EXPLORER}/${r.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-300 hover:text-brand-200"
                >
                  View tx →
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
