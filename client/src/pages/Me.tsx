import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useTickets } from "../hooks/useTickets";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { TicketIcon } from "../components/ui/icons";

export function Me() {
  const { address } = useAccount();
  const { data: tickets, isLoading, isError } = useTickets(address);

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading your tickets…
      </p>
    );
  if (isError) return <p className="text-rose-400">Could not load your tickets.</p>;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-sm text-slate-400">Tap a ticket to show its gate pass.</p>
        </div>
        <Link to="/me/listings" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          My resale listings →
        </Link>
      </div>

      {!tickets?.length ? (
        <EmptyState
          icon={<TicketIcon className="h-8 w-8" />}
          title="You have no tickets yet"
          hint="Mint one from an event and it'll appear here."
          action={<ButtonLink to="/events">Browse events</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tickets.map((t) => (
            <li key={t.tokenId}>
              <Link to={`/me/${t.tokenId}`} className="block focus-visible:outline-none">
                <div className="group overflow-hidden rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-glow">
                  <div className="flex items-center justify-between border-b border-dashed border-ink-600 p-5">
                    <p className="font-display text-lg">Ticket #{t.tokenId}</p>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/15 text-brand-300">
                      <TicketIcon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5 text-sm text-slate-400">
                    <span>
                      Event {t.eventId} · Tier {t.tier} · Seat {t.seat}
                    </span>
                    <span className="font-medium text-brand-300 group-hover:text-brand-200">
                      Show pass →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
