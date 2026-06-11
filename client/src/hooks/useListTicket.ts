import { useEffect, useRef, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { eventTicket, marketplace } from "../contracts";

type Phase = "idle" | "approving" | "listing" | "done";

/// Listing a ticket is two transactions: approve the marketplace to move the
/// NFT, then create the listing. Each confirmed tx hash is processed once so
/// the approval's receipt cannot be mistaken for the listing's.
export function useListTicket(onListed?: () => void) {
  const { writeContract, data: hash, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const [phase, setPhase] = useState<Phase>("idle");
  const pending = useRef<{ tokenId: bigint; price: bigint } | null>(null);
  const lastHash = useRef<string | null>(null);

  function start(tokenId: number, priceEth: string) {
    pending.current = { tokenId: BigInt(tokenId), price: parseEther(priceEth) };
    lastHash.current = null;
    setPhase("approving");
    writeContract({
      address: eventTicket.address,
      abi: eventTicket.abi,
      functionName: "approve",
      args: [marketplace.address, pending.current.tokenId],
    });
  }

  useEffect(() => {
    if (!isSuccess || !hash || hash === lastHash.current || !pending.current) return;
    lastHash.current = hash;
    if (phase === "approving") {
      setPhase("listing");
      writeContract({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "list",
        args: [pending.current.tokenId, pending.current.price],
      });
    } else if (phase === "listing") {
      setPhase("done");
      onListed?.();
    }
  }, [isSuccess, hash]);

  return { phase, error, start };
}
