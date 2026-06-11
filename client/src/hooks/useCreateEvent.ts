import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { eventTicket } from "../contracts";
import { apiPost } from "../lib/api";

export interface EventDraft {
  name: string;
  description: string;
  capacity: string;
  maxResalePct: string;
  royaltyPct: string;
  startsAt: string;
  prices: string[];
}

type Phase = "form" | "confirming" | "saving" | "done";

/// Drives the two-step create: write the event on-chain with an auto-generated
/// id, then on confirmation persist its off-chain content. The id is a
/// timestamp so it is unique across the global event namespace without the
/// organizer choosing a number.
export function useCreateEvent(token: string) {
  const { writeContract, data: hash, error: txError } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [eventId, setEventId] = useState<bigint | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  function submit(d: EventDraft) {
    setError(null);
    const startsSec = Math.floor(new Date(d.startsAt).getTime() / 1000);
    if (!d.name || !startsSec) {
      setError("Name and start time are required.");
      return;
    }
    const id = BigInt(Date.now());
    setDraft(d);
    setEventId(id);
    setPhase("confirming");
    writeContract({
      address: eventTicket.address,
      abi: eventTicket.abi,
      functionName: "createEvent",
      args: [
        id,
        d.name,
        BigInt(d.capacity),
        BigInt(d.maxResalePct),
        BigInt(Math.round(Number(d.royaltyPct) * 100)),
        BigInt(startsSec),
        d.prices.map((p) => parseEther(p)),
      ],
    });
  }

  useEffect(() => {
    if (!isSuccess || !draft || eventId === null || phase !== "confirming") return;
    setPhase("saving");
    apiPost(
      "/org/events",
      {
        eventId: Number(eventId),
        name: draft.name,
        description: draft.description,
        capacity: Number(draft.capacity),
        maxResalePct: Number(draft.maxResalePct),
        royaltyBps: Math.round(Number(draft.royaltyPct) * 100),
        startsAt: new Date(draft.startsAt).toISOString(),
        tierPrices: draft.prices.map((p) => parseEther(p).toString()),
      },
      token,
    )
      .then(() => setPhase("done"))
      .catch(() => setError("On-chain succeeded but saving details failed."));
  }, [isSuccess]);

  return { phase, error, txError, eventId, submit };
}
