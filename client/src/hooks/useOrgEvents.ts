import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

export interface OrgEvent {
  eventId: number;
  name: string;
  capacity: number;
  startsAt: string;
}

/// The events owned by the signed-in organizer (GET /org/events, JWT-scoped).
export function useOrgEvents(token: string) {
  return useQuery({
    queryKey: ["org-events", token],
    queryFn: () => apiGet<{ events: OrgEvent[] }>("/org/events", token).then((r) => r.events),
    enabled: Boolean(token),
  });
}
