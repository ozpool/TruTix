import { useMemo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useResale } from "../hooks/useResale";
import { useEventMap } from "../hooks/useEvents";
import { formatAddress, formatDateTime, formatTxHash } from "../lib/format";
import { chainId, marketplace } from "../contracts";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { EmptyState } from "../components/ui/EmptyState";
import { SearchInput } from "../components/ui/SearchInput";
import { Spinner } from "../components/ui/Spinner";
import { HelpHint } from "../components/ui/HelpHint";
import { StoreIcon, TicketIcon } from "../components/ui/icons";

/// Public marketplace: every active resale listing with a buy button. The price
/// is the on-chain, cap-enforced amount; buying sends exactly that value.
export function Resale() {
  const { isConnected } = useAccount();
  const { data: listings, isLoading, isError } = useResale();
  const events = useEventMap();
  const queryClient = useQueryClient();
  const { writeContract, isPending, data: hash } = useWriteContract();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings ?? [];
    return (listings ?? []).filter((l) => events.name(l.eventId).toLowerCase().includes(q));
  }, [listings, events, query]);

  function buy(tokenId: number, price: string) {
    writeContract(
      {
        chainId,
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "buy",
        args: [BigInt(tokenId)],
        value: BigInt(price),
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["resale"] });
          void queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
      },
    );
  }

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading…
      </p>
    );
  if (isError) return <p className="text-rose-400">Could not load the marketplace.</p>;

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Resale marketplace</h1>
          <HelpHint label="How resale pricing works">
            Sellers can only list at or below the cap the organizer set on-chain. The contract
            rejects anything higher, so no scalper markups get through. The price you see is the
            exact amount your wallet sends.
          </HelpHint>
        </div>
        <p className="text-sm text-slate-400">
          Every price here is capped on-chain — no scalper markups get through.
        </p>
        {!!listings?.length && (
          <SearchInput value={query} onChange={setQuery} placeholder="Search listings by event…" />
        )}
      </header>

      {listings?.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-8 w-8" />}
          title="No active listings."
          hint="When someone lists a ticket for resale, it shows up here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-8 w-8" />}
          title="No matching listings"
          hint="Try a different event name."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((l) => (
            <Card key={l.tokenId} className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  <TicketIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-display text-base">{events.name(l.eventId)}</p>
                  {events.get(l.eventId)?.startsAt && (
                    <p className="truncate text-xs text-slate-400">
                      {formatDateTime(events.get(l.eventId)?.startsAt)}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Ticket #{l.tokenId}</Badge>
                    <span className="font-mono text-sm text-citrus-300">
                      {formatEther(BigInt(l.price))} ETH
                    </span>
                    <span className="text-xs text-slate-500">
                      Seller {formatAddress(l.seller)}
                    </span>
                  </div>
                </div>
              </div>
              {isConnected ? (
                <Button size="sm" loading={isPending} onClick={() => buy(l.tokenId, l.price)}>
                  Buy
                </Button>
              ) : (
                <span className="shrink-0 text-sm text-slate-500">Connect to buy</span>
              )}
            </Card>
          ))}
        </div>
      )}

      {hash && (
        <TxStatus tone="success">Purchase submitted. Transaction {formatTxHash(hash)}</TxStatus>
      )}
    </section>
  );
}
