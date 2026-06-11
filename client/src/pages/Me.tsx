import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useTickets } from "../hooks/useTickets";

export function Me() {
  const { address } = useAccount();
  const { data: tickets, isLoading, isError } = useTickets(address);

  if (isLoading) return <p className="text-slate-400">Loading your tickets…</p>;
  if (isError) return <p className="text-rose-400">Could not load your tickets.</p>;
  if (!tickets?.length) return <p className="text-slate-400">You have no tickets yet.</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">My Tickets</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tickets.map((t) => (
          <li key={t.tokenId} className="rounded-lg border border-slate-800 p-4">
            <p className="font-semibold">Ticket #{t.tokenId}</p>
            <p className="text-sm text-slate-400">
              Event {t.eventId} · Tier {t.tier} · Seat {t.seat}
            </p>
            <Link to={`/me/${t.tokenId}`} className="mt-2 inline-block text-sm text-sky-400">
              Show gate pass →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
