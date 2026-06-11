import { Link } from "react-router-dom";
import { useOrg } from "../../org/context";
import { decodeOrgAddress } from "../../lib/orgAuth";

/// Organizer home: shows the signed-in address and entry points to the
/// create-event wizard and staff management.
export function Dashboard() {
  const { token, logout } = useOrg();
  const address = decodeOrgAddress(token);

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
    </section>
  );
}
