import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useEvents } from "../hooks/useEvents";
import { formatDate, isPast } from "../lib/format";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SearchInput } from "../components/ui/SearchInput";
import { Spinner } from "../components/ui/Spinner";
import { TicketIcon } from "../components/ui/icons";

export function Events() {
  const { data: events, isLoading, isError } = useEvents();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events ?? [];
    return (events ?? []).filter(
      (e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
    );
  }, [events, query]);

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading events…
      </p>
    );
  if (isError) return <p className="text-rose-400">Could not load events.</p>;

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-sm text-slate-400">Mint a ticket straight to your wallet.</p>
        </div>
        {!!events?.length && (
          <SearchInput value={query} onChange={setQuery} placeholder="Search events by name…" />
        )}
      </header>

      {!events?.length ? (
        <EmptyState
          icon={<TicketIcon className="h-8 w-8" />}
          title="No events yet"
          hint="Organizers haven't published anything to mint. Check back soon."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-8 w-8" />}
          title="No matching events"
          hint="Try a different search term."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const ended = isPast(event.startsAt);
            const prices = event.tierPrices.map((p) => BigInt(p));
            const from = prices.length ? prices.reduce((a, b) => (b < a ? b : a)) : 0n;
            return (
              <li key={event.eventId}>
                <Link
                  to={`/events/${event.eventId}`}
                  className="block h-full rounded-2xl focus-visible:outline-none"
                >
                  <Card interactive className="flex h-full flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-1 font-display text-base leading-snug text-slate-100">
                        {event.name}
                      </h2>
                      {ended && (
                        <Badge tone="neutral" className="shrink-0 text-[10px]">
                          Ended
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(event.startsAt)}</p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">From</p>
                        <p className="font-mono text-sm text-citrus-300">{formatEther(from)} ETH</p>
                      </div>
                      <span className="text-xs font-medium text-brand-300">View →</span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
