import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../lib/api";
import { useOrg } from "../../org/context";
import { useOrgEvents } from "../../hooks/useOrgEvents";
import { useOrgStaff, type StaffMember } from "../../hooks/useOrgStaff";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field, Input, controlClass } from "../../components/ui/Field";
import { TxStatus } from "../../components/ui/TxStatus";

/// Manage venue staff: pick one of the organizer's events, name a venue, and
/// mint a scoped access code to hand to the door person. The code is shown once
/// on creation, and a fresh one can be reissued any time from the staff list.
export function Staff() {
  const { token } = useOrg();
  const queryClient = useQueryClient();
  const { data: events } = useOrgEvents(token);
  const { data: staff } = useOrgStaff(token);

  const [eventId, setEventId] = useState("");
  const [venue, setVenue] = useState("");
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setError(null);
    setIssued(null);
    if (!eventId || !venue) {
      setError("Pick an event and name a venue.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ code: string }>(
        "/org/staff",
        { eventId: Number(eventId), venue, label },
        token,
      );
      setIssued(res.code);
      setVenue("");
      setLabel("");
      await queryClient.invalidateQueries({ queryKey: ["org-staff", token] });
    } catch {
      setError("Could not create staff. Do you own this event?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Staff</h1>
        <p className="text-sm text-slate-400">
          Issue a scoped access code the door person enters in the scanner.
        </p>
      </header>

      <Card className="space-y-4">
        <Field label="Event">
          {(p) => (
            <select
              {...p}
              className={controlClass}
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">Select an event…</option>
              {events?.map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Venue">
          {(p) => (
            <Input
              {...p}
              placeholder="Venue / gate name"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          )}
        </Field>
        <Field label="Staff name" hint="Optional — a label to recognise this code later.">
          {(p) => (
            <Input
              {...p}
              placeholder="Staff name (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          )}
        </Field>
        {error && <TxStatus tone="danger">{error}</TxStatus>}
        <Button loading={busy} onClick={() => void create()}>
          Create staff code
        </Button>

        {issued && (
          <div className="space-y-2 rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-4">
            <p className="text-sm text-emerald-300">
              Give this code to the staff member. It's shown once here.
            </p>
            <code className="block rounded-lg bg-ink-950 p-2 text-center font-mono text-lg tracking-widest text-slate-100">
              {issued}
            </code>
            <button
              className="text-sm text-brand-300 underline-offset-2 hover:underline"
              onClick={() => void navigator.clipboard.writeText(issued)}
            >
              Copy code
            </button>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <h2 className="font-display text-lg">Existing staff</h2>
        {staff?.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
        {staff?.map((s) => (
          <StaffRow
            key={s._id}
            staff={s}
            eventName={events?.find((e) => e.eventId === s.eventId)?.name ?? "Event"}
            orgToken={token}
          />
        ))}
      </div>
    </section>
  );
}

/// One staff account. The code's hash is stored, never the code, so the
/// organizer can't re-view a lost code — only mint a fresh one, which rotates
/// the hash and stops the previous code working.
function StaffRow({
  staff,
  eventName,
  orgToken,
}: {
  staff: StaffMember;
  eventName: string;
  orgToken: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rotate() {
    setError(null);
    try {
      const res = await apiPost<{ code: string }>(`/org/staff/${staff._id}/code`, {}, orgToken);
      setCode(res.code);
    } catch {
      setError("Could not issue a new code.");
    }
  }

  return (
    <Card className="space-y-2 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>
          {staff.label || "Staff"} · {staff.venue} · {eventName}
        </span>
        <button
          className="whitespace-nowrap text-brand-300 underline-offset-2 hover:underline"
          onClick={() => void rotate()}
        >
          {code ? "Issue another" : "Issue new code"}
        </button>
      </div>
      {code && (
        <>
          <p className="text-xs text-amber-300">
            New code — the previous one no longer works. Shown once.
          </p>
          <code className="block rounded-lg bg-ink-950 p-2 text-center font-mono text-base tracking-widest text-slate-100">
            {code}
          </code>
          <button
            className="text-xs text-brand-300 underline-offset-2 hover:underline"
            onClick={() => void navigator.clipboard.writeText(code)}
          >
            Copy code
          </button>
        </>
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </Card>
  );
}
