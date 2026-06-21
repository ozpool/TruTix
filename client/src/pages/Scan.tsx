import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrScanner } from "../components/QrScanner";
import {
  clearStaffCode,
  fetchStaffSession,
  getStaffCode,
  setStaffCode,
  type StaffSession,
} from "../lib/staffAuth";
import { parseGatePayload, submitScan, type ScanResult } from "../lib/scan";
import { formatAddress } from "../lib/format";
import { useRedemptions } from "../hooks/useRedemptions";
import { ScanLog } from "../components/ScanLog";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { HelpHint } from "../components/ui/HelpHint";
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

/// Staff gate scanner. The code is entered once and kept in localStorage; every
/// scan reuses it as the Bearer credential for POST /verify.
export function Scan() {
  const [code, setCode] = useState<string | null>(getStaffCode());

  if (!code) {
    return (
      <SignIn
        onAuthed={(c) => {
          setStaffCode(c);
          setCode(c);
        }}
      />
    );
  }

  return (
    <Scanner
      code={code}
      onSignOut={() => {
        clearStaffCode();
        setCode(null);
      }}
    />
  );
}

function SignIn({ onAuthed }: { onAuthed: (code: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await fetchStaffSession(trimmed); // validates the code before we store it
      onAuthed(trimmed);
    } catch {
      setError("That code is not valid or has been revoked. Check with your organizer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
        <ScanIcon className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold">Staff sign-in</h1>
      <p className="text-sm text-slate-400">
        Enter the access code your organizer gave you. You only do this once per shift.
      </p>
      <input
        className="w-full rounded-xl border border-ink-600 bg-ink-850 p-3 text-center font-mono text-lg uppercase tracking-widest text-slate-100 focus:border-brand-400 focus:outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void submit()}
        placeholder="K7P2-9QXM"
        aria-label="Staff access code"
        autoCapitalize="characters"
        autoComplete="off"
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <Button loading={busy} disabled={!value.trim()} onClick={() => void submit()}>
        Start scanning
      </Button>
    </Card>
  );
}

function Scanner({ code, onSignOut }: { code: string; onSignOut: () => void }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const queryClient = useQueryClient();
  const { data: history } = useRedemptions(code);

  const session = useQuery<StaffSession>({
    queryKey: ["staff-session", code],
    queryFn: () => fetchStaffSession(code),
    retry: false,
  });

  // A code revoked mid-shift surfaces here as a 401 — bounce to sign-in. Other
  // errors (a network blip, server hiccup) must NOT sign the staff out.
  useEffect(() => {
    if (session.isError && String(session.error).includes("401")) {
      clearStaffCode();
      onSignOut();
    }
  }, [session.isError, session.error, onSignOut]);

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
      const scan = await submitScan(payload, code);
      setResult(scan);
      if (scan.state === "valid") {
        void queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      }
    } catch (e) {
      if (String(e).includes("401")) {
        setError("Your code is no longer valid. Sign in again.");
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Gate scanner</h1>
            <HelpHint label="How scanning works">
              Point the camera at an attendee's gate QR. A valid pass is admitted and marked
              redeemed on-chain — one way, so it can't be reused. Everyone you admit is listed
              below.
            </HelpHint>
          </div>
          <p className="text-sm text-slate-400">
            {session.data ? session.data.eventName || "Event" : "Loading…"}
            {session.data ? ` · ${session.data.venue}` : ""}
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
            "animate-pop-in rounded-2xl p-5 text-center font-semibold",
            admitted ? "bg-emerald-600 text-white" : "bg-amber-500 text-ink-950",
          )}
        >
          <p className="text-lg">{STATE_LABEL[result.state] ?? result.state}</p>
          {admitted && (
            <div className="mt-1 space-y-0.5 text-sm font-normal opacity-95">
              {result.eventName && <p>{result.eventName}</p>}
              {result.tier !== undefined && result.seat !== undefined && (
                <p>
                  Tier {result.tier + 1} · Seat {result.seat}
                </p>
              )}
              {result.owner && <p className="font-mono text-xs">{formatAddress(result.owner)}</p>}
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}

      {!session.data && !session.isError && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner /> Verifying your code…
        </p>
      )}

      <ScanLog redemptions={history} />
    </section>
  );
}
