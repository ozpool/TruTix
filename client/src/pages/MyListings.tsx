import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useResale } from "../hooks/useResale";
import { useTickets } from "../hooks/useTickets";
import { useListTicket } from "../hooks/useListTicket";
import { marketplace } from "../contracts";

const inputClass = "rounded bg-slate-800 px-3 py-2 text-sm";

/// A seller's view: list a held ticket (approve + list) and cancel active
/// listings. Cancellation calls the marketplace directly.
export function MyListings() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: listings } = useResale();
  const { data: tickets } = useTickets(address);
  const { writeContract } = useWriteContract();

  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("0.05");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["resale"] });
  const { phase, error, start } = useListTicket(refresh);

  const mine = listings?.filter((l) => l.seller.toLowerCase() === address?.toLowerCase());

  function cancel(id: number) {
    writeContract(
      {
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
      <h1 className="text-2xl font-bold">My resale listings</h1>

      <div className="space-y-3 rounded-lg border border-slate-800 p-4">
        <h2 className="font-semibold">List a ticket</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className={inputClass}
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          >
            <option value="">Select a ticket…</option>
            {tickets?.map((t) => (
              <option key={t.tokenId} value={t.tokenId}>
                Ticket #{t.tokenId} (event {t.eventId})
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price ETH"
          />
          <button
            className="rounded bg-indigo-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            disabled={!tokenId || phase === "approving" || phase === "listing"}
            onClick={() => start(Number(tokenId), price)}
          >
            {phase === "approving"
              ? "Approve in wallet…"
              : phase === "listing"
                ? "Confirm listing…"
                : "List for sale"}
          </button>
        </div>
        {phase === "done" && <p className="text-sm text-emerald-400">Listed.</p>}
        {error && <p className="text-sm text-rose-400">Listing failed.</p>}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Active listings</h2>
        {mine?.length === 0 && <p className="text-slate-400">You have no active listings.</p>}
        {mine?.map((l) => (
          <div
            key={l.tokenId}
            className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3"
          >
            <span className="text-sm">
              Ticket #{l.tokenId} · {formatEther(BigInt(l.price))} ETH
            </span>
            <button className="text-sm text-rose-400 underline" onClick={() => cancel(l.tokenId)}>
              Cancel
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
