import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

export interface Listing {
  tokenId: number;
  eventId: number;
  price: string;
  seller: string;
}

/// Active resale listings cached from the on-chain marketplace (GET /resale).
export function useResale() {
  return useQuery({
    queryKey: ["resale"],
    queryFn: () => apiGet<{ listings: Listing[] }>("/resale").then((r) => r.listings),
  });
}
