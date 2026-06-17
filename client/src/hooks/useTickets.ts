import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

export interface Ticket {
  tokenId: number;
  eventId: number;
  owner: string;
  tier: number;
  seat: number;
}

export function useTickets(owner: string | undefined) {
  return useQuery({
    queryKey: ["tickets", owner],
    queryFn: () => apiGet<{ tickets: Ticket[] }>(`/tickets?owner=${owner}`).then((r) => r.tickets),
    enabled: Boolean(owner),
    // Poll so a mint or incoming transfer the indexer catches shows up live.
    refetchInterval: 15_000,
  });
}
