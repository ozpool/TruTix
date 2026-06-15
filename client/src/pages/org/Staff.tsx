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
/// mint a scoped access token to hand to the door person. The token is shown
/// once on creation, and can be reissued any time from the staff list.
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
      const res = await apiPost<{ token: string }>(
        "/org/staff",
        { eventId: Number(eventId), venue, label },
        token,
      );
      setIssued(res.token);
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
          Issue a scoped token the door person pastes into the scanner.
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
                  {ev.name} (#{ev.eventId})
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
        <Field label="Staff name" hint="Optional — a label to recognise this token later.">
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
          Create staff token
        </Button>

        {issued && (
          <div className="space-y-2 rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-4">
            <p className="text-sm text-emerald-300">
              Give this token to the staff member. It's shown once here.
            </p>
            <code className="block break-all rounded-lg bg-ink-950 p-2 font-mono text-xs text-slate-300">
              {issued}
            </code>
            <button
              className="text-sm text-brand-300 underline-offset-2 hover:underline"
              onClick={() => void navigator.clipboard.writeText(issued)}
            >
              Copy token
            </button>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <h2 className="font-display text-lg">Existing staff</h2>
        {staff?.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
        {staff?.map((s) => (
          <StaffRow key={s._id} staff={s} orgToken={token} />
        ))}
      </div>
    </section>
  );
}

/// One staff account with an on-demand "Show token" — the token isn't stored,
/// so it is reissued from the server when the organizer needs it again.
function StaffRow({ staff, orgToken }: { staff: StaffMember; orgToken: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setError(null);
    try {
      const res = await apiPost<{ token: string }>(`/org/staff/${staff._id}/token`, {}, orgToken);
      setToken(res.token);
    } catch {
      setError("Could not reissue the token.");
    }
  }

  return (
    <Card className="space-y-2 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>
          {staff.label || "Staff"} · {staff.venue} · event #{staff.eventId}
        </span>
        <button
          className="whitespace-nowrap text-brand-300 underline-offset-2 hover:underline"
          onClick={() => void reveal()}
        >
          {token ? "Reissue" : "Show token"}
        </button>
      </div>
      {token && (
        <>
          <code className="block break-all rounded-lg bg-ink-950 p-2 font-mono text-xs text-slate-300">
            {token}
          </code>
          <button
            className="text-xs text-brand-300 underline-offset-2 hover:underline"
            onClick={() => void navigator.clipboard.writeText(token)}
          >
            Copy token
          </button>
        </>
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </Card>
  );
}
