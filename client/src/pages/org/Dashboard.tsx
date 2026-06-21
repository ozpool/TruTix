import { useOrg } from "../../org/context";
import { decodeOrgAddress } from "../../lib/orgAuth";
import { useOrgEvents } from "../../hooks/useOrgEvents";
import { formatAddress, formatDateTime } from "../../lib/format";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { PlusIcon, TicketIcon } from "../../components/ui/icons";

/// Organizer home: shows the signed-in address, the organizer's events, and
/// entry points to the create-event wizard and staff management.
export function Dashboard() {
  const { token, logout } = useOrg();
  const address = decodeOrgAddress(token);
  const { data: events, isLoading } = useOrgEvents(token);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Organizer</h1>
          {address && (
            <p className="font-mono text-sm text-slate-400" title={address}>
              {formatAddress(address)}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/org/new">
          <PlusIcon className="h-4 w-4" /> Create event
        </ButtonLink>
        <ButtonLink to="/org/staff" variant="secondary">
          Manage staff
        </ButtonLink>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg">Your events</h2>
        {isLoading && (
          <p className="flex items-center gap-2 text-slate-400">
            <Spinner /> Loading…
          </p>
        )}
        {events?.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="h-8 w-8" />}
            title="No events yet"
            hint="Create your first event to start selling tickets."
            action={<ButtonLink to="/org/new">Create event</ButtonLink>}
          />
        ) : (
          events?.map((e) => (
            <Card key={e.eventId} className="flex items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="font-display text-base">{e.name}</p>
                <p className="text-sm text-slate-400">
                  {formatDateTime(e.startsAt)} · capacity {e.capacity}
                </p>
              </div>
              <Badge tone="brand">Live</Badge>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
