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
    <section className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Staff sign-in</h1>
      <p className="text-sm text-slate-400">
        Paste the access token your organizer gave you. You only do this once per shift.
      </p>
      <textarea
        className="h-28 w-full rounded-lg bg-slate-800 p-3 font-mono text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="eyJhbGciOi…"
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button
        className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold disabled:opacity-50"
        disabled={!value.trim()}
        onClick={submit}
      >
        Start scanning
      </button>
    </section>
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
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gate scanner</h1>
          <p className="text-sm text-slate-400">
            Event {claims.eventId} · {claims.venue}
          </p>
        </div>
        <button className="text-sm text-slate-400 underline" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <QrScanner onResult={(t) => void handleResult(t)} />

      {result && (
        <div
          className={`rounded-lg p-4 font-semibold ${admitted ? "bg-emerald-600" : "bg-amber-600"}`}
        >
          {STATE_LABEL[result.state] ?? result.state}
          {admitted && result.owner && (
            <p className="mt-1 text-sm font-normal opacity-80">{result.owner}</p>
          )}
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </section>
  );
}
