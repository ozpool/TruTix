import { Link } from "react-router-dom";
import { useOrg } from "../../org/context";
import { decodeOrgAddress } from "../../lib/orgAuth";
import { useOrgEvents } from "../../hooks/useOrgEvents";

/// Organizer home: shows the signed-in address, the organizer's events, and
/// entry points to the create-event wizard and staff management.
export function Dashboard() {
  const { token, logout } = useOrg();
  const address = decodeOrgAddress(token);
  const { data: events, isLoading } = useOrgEvents(token);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizer</h1>
          {address && <p className="font-mono text-sm text-slate-400">{address}</p>}
        </div>
        <button className="text-sm text-slate-400 underline" onClick={logout}>
          Sign out
        </button>
      </header>

      <div className="flex gap-4">
        <Link to="/org/new" className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white">
          Create event
        </Link>
        <Link
          to="/org/staff"
          className="rounded-lg border border-slate-700 px-4 py-2 font-semibold"
        >
          Manage staff
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your events</h2>
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {events?.length === 0 && <p className="text-slate-400">No events yet.</p>}
        {events?.map((e) => (
          <div key={e.eventId} className="rounded-lg border border-slate-800 px-4 py-3">
            <p className="font-semibold">{e.name}</p>
            <p className="text-sm text-slate-400">
              Event #{e.eventId} · capacity {e.capacity}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
