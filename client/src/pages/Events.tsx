import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useEvents } from "../hooks/useEvents";

export function Events() {
  const { data: events, isLoading, isError } = useEvents();

  if (isLoading) return <p className="text-slate-400">Loading events…</p>;
  if (isError) return <p className="text-rose-400">Could not load events.</p>;
  if (!events?.length) return <p className="text-slate-400">No events yet.</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Events</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <li key={event.eventId} className="rounded-lg border border-slate-800 p-4">
            <h2 className="font-semibold">{event.name}</h2>
            <p className="text-sm text-slate-400">{event.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              From {formatEther(BigInt(event.tierPrices[0] ?? "0"))} ETH
            </p>
            <Link
              to={`/events/${event.eventId}`}
              className="mt-3 inline-block text-sm text-sky-400"
            >
              View →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
