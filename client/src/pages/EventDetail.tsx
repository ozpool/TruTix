import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useEvent } from "../hooks/useEvents";
import { chainId, eventTicket } from "../contracts";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, controlClass } from "../components/ui/Field";
import { TxStatus } from "../components/ui/TxStatus";
import { Spinner } from "../components/ui/Spinner";

export function EventDetail() {
  const { eventId } = useParams();
  const { data: event, isLoading } = useEvent(eventId);
  const { isConnected } = useAccount();
  const { writeContract, isPending, data: hash, error } = useWriteContract();
  const [tier, setTier] = useState(0);

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading…
      </p>
    );
  if (!event) return <p className="text-slate-400">Event not found.</p>;

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
      <div className="space-y-4">
        <Badge tone="brand">Event #{event.eventId}</Badge>
        <h1 className="text-3xl font-bold">{event.name}</h1>
        {event.description && <p className="max-w-prose text-slate-300">{event.description}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge>Capacity {event.capacity}</Badge>
          <Badge>Resale cap {event.maxResalePct}%</Badge>
          <Badge>Royalty {event.royaltyBps / 100}%</Badge>
        </div>
      </div>

      <Card className="h-fit space-y-4">
        <h2 className="font-display text-lg">Get a ticket</h2>
        <Field label="Tier">
          {(p) => (
            <select
              {...p}
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
              className={controlClass}
            >
              {event.tierPrices.map((tp, i) => (
                <option key={i} value={i}>
                  Tier {i} — {formatEther(BigInt(tp))} ETH
                </option>
              ))}
            </select>
          )}
        </Field>

        {isConnected ? (
          <Button onClick={mint} loading={isPending} className="w-full">
            {isPending ? "Minting…" : `Mint for ${formatEther(price)} ETH`}
          </Button>
        ) : (
          <p className="text-sm text-slate-400">Connect your wallet to mint.</p>
        )}

        {hash && (
          <TxStatus tone="success">Minted! Transaction {hash.slice(0, 10)}… confirmed.</TxStatus>
        )}
        {error && <TxStatus tone="danger">Mint failed — check your wallet and try again.</TxStatus>}
      </Card>
    </section>
  );
}
