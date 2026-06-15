import { useRef, useState } from "react";
import { QrScanner } from "../components/QrScanner";
import {
  clearStaffToken,
  decodeStaffClaims,
  getStaffToken,
  setStaffToken,
  type StaffClaims,
} from "../lib/staffAuth";
import { parseGatePayload, submitScan, type ScanResult } from "../lib/scan";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";
import { ScanIcon } from "../components/ui/icons";

const STATE_LABEL: Record<string, string> = {
  valid: "Admitted",
  stale: "Expired pass — ask for a fresh QR",
  wrong_event: "Wrong event",
  not_owner: "Signer does not own this ticket",
  already_redeemed: "Already redeemed",
  redeem_failed: "Redeem failed — try again",
};

/// Staff gate scanner. The token is pasted once and kept in localStorage; every
/// scan reuses it as the Bearer credential for POST /verify.
export function Scan() {
  const [token, setToken] = useState<string | null>(getStaffToken());
  const claims: StaffClaims | null = token ? decodeStaffClaims(token) : null;

  if (!token || !claims) {
    return <SignIn onToken={setToken} />;
  }

  return (
    <Scanner
      claims={claims}
      token={token}
      onSignOut={() => {
        clearStaffToken();
        setToken(null);
      }}
    />
  );
}

function SignIn({ onToken }: { onToken: (t: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = value.trim();
    if (!decodeStaffClaims(trimmed)) {
      setError("That does not look like a valid staff token.");
      return;
    }
    setStaffToken(trimmed);
    onToken(trimmed);
  }

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
        <ScanIcon className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold">Staff sign-in</h1>
      <p className="text-sm text-slate-400">
        Paste the access token your organizer gave you. You only do this once per shift.
      </p>
      <textarea
        className="h-28 w-full rounded-xl border border-ink-600 bg-ink-850 p-3 font-mono text-sm text-slate-100 focus:border-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="eyJhbGciOi…"
        aria-label="Staff access token"
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <Button disabled={!value.trim()} onClick={submit}>
        Start scanning
      </Button>
    </Card>
  );
}

function Scanner({
  claims,
  token,
  onSignOut,
}: {
  claims: StaffClaims;
  token: string;
  onSignOut: () => void;
}) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  async function handleResult(text: string) {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    const payload = parseGatePayload(text);
    if (!payload) {
      setError("Unrecognized QR code.");
      busy.current = false;
      return;
    }
    try {
      setResult(await submitScan(payload, token));
    } catch (e) {
      if (String(e).includes("401")) {
        setError("Your token expired. Sign in again.");
        onSignOut();
      } else {
        setError("Could not reach the gate service.");
      }
    } finally {
      busy.current = false;
    }
  }

  const admitted = result?.state === "valid";

  return (
    <section className="mx-auto max-w-md space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gate scanner</h1>
          <p className="text-sm text-slate-400">
            Event {claims.eventId} · {claims.venue}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          Sign out
        </Button>
      </header>

      <Card className="space-y-3 p-3">
        <div className="overflow-hidden rounded-xl">
          <QrScanner onResult={(t) => void handleResult(t)} />
        </div>
        <p className="text-center text-xs text-slate-500">
          Point the camera at the attendee's gate QR.
        </p>
      </Card>

      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={cn(
            "animate-pop-in rounded-2xl p-5 text-center text-lg font-semibold",
            admitted ? "bg-emerald-600 text-white" : "bg-amber-500 text-ink-950",
          )}
        >
          {STATE_LABEL[result.state] ?? result.state}
          {admitted && result.owner && (
            <p className="mt-1 font-mono text-xs font-normal opacity-90">{result.owner}</p>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
