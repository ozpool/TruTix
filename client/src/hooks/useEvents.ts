import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

/// These lists are fed by the chain indexer, so poll to surface mints,
/// transfers and new events caught from other wallets without a reload.
const LIVE_REFETCH_MS = 15_000;

export interface EventSummary {
  eventId: number;
  name: string;
  description: string;
  heroImage: string;
  capacity: number;
  maxResalePct: number;
  royaltyBps: number;
  startsAt: string;
  tierPrices: string[];
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => apiGet<{ events: EventSummary[] }>("/events").then((r) => r.events),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

/// Builds an eventId → summary lookup from the events list so any screen can
/// show a human event name (and details) instead of a bare numeric id. Returns
/// a helper that falls back to "Event #id" while the list is still loading.
export function useEventMap() {
  const { data } = useEvents();
  return useMemo(() => {
    const byId = new Map<number, EventSummary>();
    for (const e of data ?? []) byId.set(e.eventId, e);
    return {
      get: (eventId: number) => byId.get(eventId),
      name: (eventId: number) => byId.get(eventId)?.name ?? `Event #${eventId}`,
    };
  }, [data]);
}

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiGet<EventSummary>(`/events/${eventId}`),
    enabled: Boolean(eventId),
    refetchInterval: LIVE_REFETCH_MS,
  });
}
