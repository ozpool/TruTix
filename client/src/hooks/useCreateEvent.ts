import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { chainId, eventTicket } from "../contracts";
import { apiGet, apiPost } from "../lib/api";

export interface EventDraft {
  name: string;
  description: string;
  capacity: string;
  maxResalePct: string;
  royaltyPct: string;
  startsAt: string;
  prices: string[];
  names: string[];
}

type Phase = "form" | "confirming" | "granting" | "done";

/// Drives the three-step create: write the event on-chain with an
/// auto-generated id, persist its off-chain content on confirmation, then
/// grant the backend redeemer wallet so gate scans can settle on-chain. The id
/// is a timestamp so it is unique across the global event namespace without
/// the organizer choosing a number.
export function useCreateEvent(token: string) {
  const create = useWriteContract();
  const grant = useWriteContract();
  const { isSuccess: created } = useWaitForTransactionReceipt({ hash: create.data });
  const { isSuccess: granted } = useWaitForTransactionReceipt({ hash: grant.data });
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [eventId, setEventId] = useState<bigint | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function submit(d: EventDraft) {
    setError(null);
    const startsSec = Math.floor(new Date(d.startsAt).getTime() / 1000);
    if (!d.name || !startsSec) {
      setError("Name and start time are required.");
      return;
    }
    if (startsSec * 1000 <= Date.now()) {
      setError("Start time must be in the future.");
      return;
    }
    const id = BigInt(Date.now());
    setDraft(d);
    setEventId(id);
    setPhase("confirming");
    create.writeContract({
      chainId,
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

  // Saving the off-chain details is best-effort: the indexer caches the
  // on-chain terms either way, so a failed save (e.g. an expired session)
  // must not block authorizing the scanner.
  useEffect(() => {
    if (!created || !draft || eventId === null || phase !== "confirming") return;
    setPhase("granting");
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
        tierNames: draft.names.map((n) => n.trim()),
      },
      token,
    ).catch(() =>
      addWarning("The description was not saved; the event shows its on-chain details."),
    );
  }, [created]);

  function addWarning(message: string) {
    setWarning((current) => (current ? `${current} ${message}` : message));
  }

  // The grant is best-effort: the event exists either way, so a missing
  // redeemer wallet or a rejected transaction finishes with a warning
  // instead of blocking the organizer.
  function finishWithoutGrant(reason: string) {
    addWarning(
      `Gate scanning is not authorized yet (${reason}). ` +
        `Grant the redeemer wallet for this event before the doors open.`,
    );
    setPhase("done");
  }

  useEffect(() => {
    if (phase !== "granting" || eventId === null) return;
    apiGet<{ address: string }>("/org/redeemer", token)
      .then(({ address }) =>
        grant.writeContract({
          chainId,
          address: eventTicket.address,
          abi: eventTicket.abi,
          functionName: "grantRedeemer",
          args: [eventId, address as `0x${string}`],
        }),
      )
      .catch(() => finishWithoutGrant("scanner wallet unavailable"));
  }, [phase]);

  useEffect(() => {
    if (granted && phase === "granting") setPhase("done");
  }, [granted]);

  useEffect(() => {
    if (grant.error && phase === "granting") finishWithoutGrant("transaction not confirmed");
  }, [grant.error]);

  return {
    phase,
    error,
    txError: create.error,
    warning,
    eventId,
    txHash: create.data,
    submit,
  };
}
