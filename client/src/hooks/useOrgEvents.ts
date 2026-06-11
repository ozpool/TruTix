import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useOrg } from "../org/context";

export interface OrgEvent {
  eventId: number;
  name: string;
  capacity: number;
  startsAt: string;
}

/// The events owned by the signed-in organizer (GET /org/events, JWT-scoped).
/// Signs the organizer out if the token has expired (401).
export function useOrgEvents(token: string) {
  const { logout } = useOrg();
  const query = useQuery({
    queryKey: ["org-events", token],
    queryFn: () => apiGet<{ events: OrgEvent[] }>("/org/events", token).then((r) => r.events),
    enabled: Boolean(token),
    retry: false,
  });
  useEffect(() => {
    if (query.error && String(query.error).includes("401")) logout();
  }, [query.error, logout]);
  return query;
}
