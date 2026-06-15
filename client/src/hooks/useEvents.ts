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

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiGet<EventSummary>(`/events/${eventId}`),
    enabled: Boolean(eventId),
    refetchInterval: LIVE_REFETCH_MS,
  });
}
