import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

export interface Redemption {
  tokenId: number;
  eventId: number;
  staffId: string;
  owner: string;
  txHash: string;
  redeemedAt: string;
}

/// The redemption history for the staff token's event — everyone admitted at
/// this gate. Polls as a backstop; useLiveSync also refreshes it each block.
export function useRedemptions(token: string | null) {
  return useQuery({
    queryKey: ["scan-history"],
    queryFn: () =>
      apiGet<{ redemptions: Redemption[] }>("/redemptions", token ?? undefined).then(
        (r) => r.redemptions,
      ),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}
