import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSignMessage } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import { gateMessage } from "../lib/gate";

/// Shows a wallet-signed QR for the gate. The signature is refreshed every 60s so
/// a screenshot expires; the backend rejects timestamps older than 60s.
export function TicketPass() {
  const { tokenId } = useParams();
  const id = Number(tokenId);
  const { signMessageAsync } = useSignMessage();
  const [qr, setQr] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const timestamp = Date.now();
        const signature = await signMessageAsync({ message: gateMessage(id, timestamp) });
        if (!active) return;
        setQr(JSON.stringify({ tokenId: id, timestamp, signature }));
        setSecondsLeft(60);
        setFailed(false);
      } catch {
        if (active) setFailed(true);
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, signMessageAsync]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Ticket #{id}</h1>
      {qr ? (
        <>
          <div className="inline-block rounded-lg bg-white p-4">
            <QRCodeSVG value={qr} size={240} />
          </div>
          <p className="text-sm text-slate-400">Refreshes in {secondsLeft}s</p>
        </>
      ) : (
        <p className="text-slate-400">Approve the signature in your wallet to show the pass…</p>
      )}
      {failed && <p className="text-sm text-rose-400">Could not sign the pass.</p>}
    </section>
  );
}
