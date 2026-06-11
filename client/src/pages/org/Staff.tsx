import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../lib/api";
import { useOrg } from "../../org/context";
import { useOrgEvents } from "../../hooks/useOrgEvents";
import { useOrgStaff } from "../../hooks/useOrgStaff";

const inputClass = "w-full rounded bg-slate-800 px-3 py-2 text-sm";

/// Manage venue staff: pick one of the organizer's events, name a venue, and
/// mint a scoped access token to hand to the door person. The token is shown
/// once, with a copy button — the staff member pastes it into /scan.
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

  async function create() {
    setError(null);
    setIssued(null);
    if (!eventId || !venue) {
      setError("Pick an event and name a venue.");
      return;
    }
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
    }
  }

  return (
    <section className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Staff</h1>

      <div className="space-y-3">
        <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Select an event…</option>
          {events?.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.name} (#{ev.eventId})
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Venue / gate name"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Staff name (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold"
          onClick={() => void create()}
        >
          Create staff token
        </button>
      </div>

      {issued && (
        <div className="space-y-2 rounded-lg border border-emerald-700 bg-emerald-950 p-4">
          <p className="text-sm text-emerald-300">
            Give this token to the staff member. It is shown once.
          </p>
          <code className="block break-all rounded bg-slate-900 p-2 font-mono text-xs">
            {issued}
          </code>
          <button
            className="text-sm underline"
            onClick={() => void navigator.clipboard.writeText(issued)}
          >
            Copy token
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Existing staff</h2>
        {staff?.length === 0 && <p className="text-slate-400">None yet.</p>}
        {staff?.map((s) => (
          <div key={s._id} className="rounded-lg border border-slate-800 px-4 py-2 text-sm">
            {s.label || "Staff"} · {s.venue} · event #{s.eventId}
          </div>
        ))}
      </div>
    </section>
  );
}
