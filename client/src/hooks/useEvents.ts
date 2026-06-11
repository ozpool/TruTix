import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

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
  });
}

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiGet<EventSummary>(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });
}
