import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useResale } from "../hooks/useResale";
import { useEventMap } from "../hooks/useEvents";
import { useTickets } from "../hooks/useTickets";
import { useListTicket } from "../hooks/useListTicket";
import { chainId, marketplace } from "../contracts";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, controlClass } from "../components/ui/Field";
import { TxStatus } from "../components/ui/TxStatus";
import { EmptyState } from "../components/ui/EmptyState";

/// A seller's view: list a held ticket (approve + list) and cancel active
/// listings. Cancellation calls the marketplace directly.
export function MyListings() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: listings } = useResale();
  const events = useEventMap();
  const { data: tickets } = useTickets(address);
  const { writeContract } = useWriteContract();

  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("0.05");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["resale"] });
  const { phase, error, start } = useListTicket(refresh);

  const mine = listings?.filter((l) => l.seller.toLowerCase() === address?.toLowerCase());
  const busy = phase === "approving" || phase === "listing";

  function cancel(id: number) {
    writeContract(
      {
        chainId,
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "cancel",
        args: [BigInt(id)],
      },
      { onSuccess: refresh },
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">My resale listings</h1>
        <p className="text-sm text-slate-400">
          List a ticket within the on-chain cap, or cancel an active listing.
        </p>
      </header>

      <Card className="space-y-4">
        <h2 className="font-display text-lg">List a ticket</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Ticket">
            {(p) => (
              <select
                {...p}
                className={controlClass}
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              >
                <option value="">Select a ticket…</option>
                {tickets?.map((t) => (
                  <option key={t.tokenId} value={t.tokenId}>
                    {events.name(t.eventId)} — Ticket #{t.tokenId}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Price">
            {(p) => (
              <Input
                {...p}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price ETH"
                inputMode="decimal"
              />
            )}
          </Field>
          <Button disabled={!tokenId} loading={busy} onClick={() => start(Number(tokenId), price)}>
            {phase === "approving"
              ? "Approve in wallet…"
              : phase === "listing"
                ? "Confirm listing…"
                : "List for sale"}
          </Button>
        </div>
        {phase === "done" && (
          <TxStatus tone="success">Listed — it's live on the marketplace.</TxStatus>
        )}
        {error && <TxStatus tone="danger">{error}</TxStatus>}
      </Card>

      <div className="space-y-3">
        <h2 className="font-display text-lg">Active listings</h2>
        {mine?.length === 0 ? (
          <EmptyState title="You have no active listings." />
        ) : (
          mine?.map((l) => (
            <Card key={l.tokenId} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{events.name(l.eventId)}</p>
                <p className="text-xs text-slate-400">
                  Ticket #{l.tokenId} ·{" "}
                  <span className="font-mono text-citrus-300">
                    {formatEther(BigInt(l.price))} ETH
                  </span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => cancel(l.tokenId)}>
                Cancel
              </Button>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
