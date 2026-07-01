import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useEvent } from "../hooks/useEvents";
import { formatDateTime, isPast, tierLabel } from "../lib/format";
import { txErrorMessage } from "../lib/txError";
import { cn } from "../lib/cn";
import { chainId, eventTicket } from "../contracts";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { TxLink } from "../components/ui/TxLink";
import { Spinner } from "../components/ui/Spinner";

export function EventDetail() {
  const { eventId } = useParams();
  const { data: event, isLoading, isError } = useEvent(eventId);
  const { isConnected } = useAccount();
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const queryClient = useQueryClient();
  const [tier, setTier] = useState(0);

  // The full mint lifecycle: signing in the wallet → pending in a block →
  // confirmed. We only claim success once the receipt lands with status success.
  const confirming = Boolean(hash) && receipt.isLoading;
  const confirmed = receipt.isSuccess && receipt.data?.status === "success";
  const reverted = receipt.isSuccess && receipt.data?.status === "reverted";

  // On confirmation, refresh the ticket lists so the new ticket appears without
  // a manual reload — both the on-chain read and the cached API list.
  useEffect(() => {
    if (!confirmed) return;
    void queryClient.invalidateQueries({ queryKey: ["owned-tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  }, [confirmed, queryClient]);

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading…
      </p>
    );
  if (isError) return <p className="text-rose-400">Couldn't load this event. Please try again.</p>;
  if (!event) return <p className="text-slate-400">Event not found.</p>;

  const ended = isPast(event.startsAt);
  const price = BigInt(event.tierPrices[tier] ?? "0");

  function mint() {
    if (!event) return;
    writeContract({
      chainId,
      address: eventTicket.address,
      abi: eventTicket.abi,
      functionName: "mint",
      args: [BigInt(event.eventId), tier],
      value: price,
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Left: full event details */}
      <div className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="flex items-center gap-2 text-slate-300">
            {formatDateTime(event.startsAt)}
            {ended && <Badge tone="warn">Event ended</Badge>}
          </p>
        </div>

        {event.description && (
          <p className="max-w-prose whitespace-pre-line text-slate-300">{event.description}</p>
        )}

        <dl className="grid max-w-md gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
            <dt className="text-xs text-slate-500">Capacity</dt>
            <dd className="mt-0.5 font-display text-lg text-slate-100">{event.capacity}</dd>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
            <dt className="text-xs text-slate-500">Resale cap</dt>
            <dd className="mt-0.5 font-display text-lg text-slate-100">+{event.maxResalePct}%</dd>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
            <dt className="text-xs text-slate-500">Creator royalty</dt>
            <dd className="mt-0.5 font-display text-lg text-slate-100">
              {event.royaltyBps / 100}%
            </dd>
          </div>
        </dl>

        <p className="max-w-prose text-xs text-slate-500">
          Resale is capped at {event.maxResalePct}% over face value — enforced by the contract, not
          just the app. The creator earns {event.royaltyBps / 100}% on every resale.
        </p>
      </div>

      {/* Right: pick a tier and buy */}
      <Card className="h-fit space-y-4">
        <h2 className="font-display text-lg">Get a ticket</h2>

        <fieldset className="space-y-2">
          <legend className="sr-only">Choose a ticket tier</legend>
          {event.tierPrices.map((tp, i) => {
            const selected = tier === i;
            return (
              <label
                key={i}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition",
                  selected
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-ink-600 bg-ink-850 hover:border-ink-500",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tier"
                    value={i}
                    checked={selected}
                    onChange={() => setTier(i)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <span className="font-medium text-slate-100">{tierLabel(event, i)}</span>
                </span>
                <span className="font-mono text-sm text-citrus-300">
                  {formatEther(BigInt(tp))} ETH
                </span>
              </label>
            );
          })}
        </fieldset>

        {ended ? (
          <TxStatus tone="warn">This event has ended — minting is closed.</TxStatus>
        ) : isConnected ? (
          <Button onClick={mint} loading={isPending || confirming} className="w-full">
            {isPending
              ? "Waiting for wallet…"
              : confirming
                ? "Confirming on-chain…"
                : `Mint ${tierLabel(event, tier)} — ${formatEther(price)} ETH`}
          </Button>
        ) : (
          <p className="text-sm text-slate-400">Connect your wallet to mint.</p>
        )}

        {writeError && <TxStatus tone="danger">{txErrorMessage(writeError)}</TxStatus>}

        {hash && confirming && (
          <TxStatus tone="info">
            <p>Confirming your mint on-chain… this usually takes a few seconds.</p>
            <p className="mt-1">
              <TxLink hash={hash} label="Track it live on BaseScan" />
            </p>
          </TxStatus>
        )}

        {hash && reverted && (
          <TxStatus tone="danger">
            <p>
              The mint reverted on-chain — no ticket was created and the ticket price was not taken
              (only gas). Please try again.
            </p>
            <p className="mt-1">
              <TxLink hash={hash} label="See the failed transaction" />
            </p>
          </TxStatus>
        )}

        {hash && receipt.isError && !reverted && (
          <TxStatus tone="warn">
            <p>
              Your mint was submitted, but we couldn't confirm it yet. Check its status on the
              explorer, then refresh My Tickets.
            </p>
            <p className="mt-1">
              <TxLink hash={hash} label="Check on BaseScan" />
            </p>
          </TxStatus>
        )}

        {hash && confirmed && (
          <TxStatus tone="success">
            <p>Ticket confirmed 🎟️ It's now in your wallet.</p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/me" className="font-medium text-brand-300 hover:text-brand-200">
                View in My Tickets →
              </Link>
              <TxLink hash={hash} label="View transaction" />
            </p>
          </TxStatus>
        )}
      </Card>
    </section>
  );
}
