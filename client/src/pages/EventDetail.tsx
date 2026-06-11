import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useEvent } from "../hooks/useEvents";
import { eventTicket } from "../contracts";

export function EventDetail() {
  const { eventId } = useParams();
  const { data: event, isLoading } = useEvent(eventId);
  const { isConnected } = useAccount();
  const { writeContract, isPending, data: hash, error } = useWriteContract();
  const [tier, setTier] = useState(0);

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!event) return <p className="text-slate-400">Event not found.</p>;

  const price = BigInt(event.tierPrices[tier] ?? "0");

  function mint() {
    if (!event) return;
    writeContract({
      address: eventTicket.address,
      abi: eventTicket.abi,
      functionName: "mint",
      args: [BigInt(event.eventId), tier],
      value: price,
    });
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{event.name}</h1>
      <p className="text-slate-300">{event.description}</p>

      <div className="space-y-1">
        <label className="block text-sm text-slate-400">Tier</label>
        <select
          value={tier}
          onChange={(e) => setTier(Number(e.target.value))}
          className="rounded bg-slate-800 px-3 py-2"
        >
          {event.tierPrices.map((p, i) => (
            <option key={i} value={i}>
              Tier {i} — {formatEther(BigInt(p))} ETH
            </option>
          ))}
        </select>
      </div>

      {isConnected ? (
        <button
          onClick={mint}
          disabled={isPending}
          className="rounded bg-sky-500 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Minting…" : `Mint for ${formatEther(price)} ETH`}
        </button>
      ) : (
        <p className="text-slate-400">Connect your wallet to mint.</p>
      )}

      {hash && <p className="text-sm text-emerald-400">Minted. Tx {hash.slice(0, 10)}…</p>}
      {error && <p className="text-sm text-rose-400">Mint failed.</p>}
    </section>
  );
}
