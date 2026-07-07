import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSignMessage } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import { gateMessage } from "../lib/gate";
import { Spinner } from "../components/ui/Spinner";

const FRESH_SECONDS = 60;

/// Shows a wallet-signed QR for the gate. The signature is refreshed periodically
/// so a screenshot expires; the backend rejects stale timestamps.
export function TicketPass() {
  const { tokenId } = useParams();
  const id = Number(tokenId);
  const { signMessageAsync } = useSignMessage();
  const [qr, setQr] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FRESH_SECONDS);
  const [failed, setFailed] = useState(false);
  const signingRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      if (signingRef.current) return; // dev StrictMode re-fires this effect; skip the duplicate prompt
      signingRef.current = true;
      try {
        const timestamp = Date.now();
        const signature = await signMessageAsync({ message: gateMessage(id, timestamp) });
        if (!active) return;
        setQr(JSON.stringify({ tokenId: id, timestamp, signature }));
        setSecondsLeft(FRESH_SECONDS);
        setFailed(false);
      } catch {
        if (active) setFailed(true);
      } finally {
        signingRef.current = false;
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), FRESH_SECONDS * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, signMessageAsync]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(tick);
  }, []);

  const pct = Math.max(0, Math.min(100, (secondsLeft / FRESH_SECONDS) * 100));

  return (
    <section className="mx-auto max-w-sm space-y-5">
      <Link to="/me" className="text-sm text-slate-400 hover:text-slate-200">
        ← My Tickets
      </Link>

      <div className="overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 shadow-card">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-display text-xl">Ticket #{id}</h1>
          <span className="font-mono text-xs text-slate-500">GATE PASS</span>
        </div>

        {/* Perforated divider, the ticket-stub motif. */}
        <div className="relative h-4 border-y border-dashed border-ink-600">
          <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink-950" />
          <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink-950" />
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6">
          {qr ? (
            <>
              <div className="animate-pop-in rounded-2xl bg-white p-4">
                <QRCodeSVG value={qr} size={232} />
              </div>
              <div className="w-full space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-citrus-400 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500" aria-live="polite">
                  Refreshes in {secondsLeft}s — keep this screen open at the gate.
                </p>
              </div>
            </>
          ) : (
            <p className="flex items-center gap-2 py-10 text-sm text-slate-400">
              <Spinner /> Approve the signature in your wallet to show the pass…
            </p>
          )}
          {failed && (
            <p className="text-sm text-rose-400" role="alert">
              Could not sign the pass. Reopen and approve in your wallet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
