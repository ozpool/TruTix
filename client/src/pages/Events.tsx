import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useEvents } from "../hooks/useEvents";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { TicketIcon } from "../components/ui/icons";

export function Events() {
  const { data: events, isLoading, isError } = useEvents();

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading events…
      </p>
    );
  if (isError) return <p className="text-rose-400">Could not load events.</p>;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-sm text-slate-400">Mint a ticket straight to your wallet.</p>
      </header>

      {!events?.length ? (
        <EmptyState
          icon={<TicketIcon className="h-8 w-8" />}
          title="No events yet"
          hint="Organizers haven't published anything to mint. Check back soon."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.eventId}>
              <Link
                to={`/events/${event.eventId}`}
                className="block rounded-2xl focus-visible:outline-none"
              >
                <Card interactive className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg text-slate-100">{event.name}</h2>
                    <Badge tone="citrus">
                      {formatEther(BigInt(event.tierPrices[0] ?? "0"))} ETH
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{event.description}</p>
                  )}
                  <p className="mt-4 text-sm font-medium text-brand-300">View event →</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
