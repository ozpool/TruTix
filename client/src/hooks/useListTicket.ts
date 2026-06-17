import { useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { chainId, eventTicket, marketplace } from "../contracts";

type Phase = "idle" | "approving" | "listing" | "done";

/// Listing a ticket is two transactions: approve the marketplace to move the
/// NFT, then create the listing. The listing call is simulated first so a
/// contract rejection (price above the resale cap) surfaces as a readable
/// message instead of a cryptic wallet gas error. Each confirmed tx hash is
/// processed once so the approval's receipt cannot be mistaken for the
/// listing's.
export function useListTicket(onListed?: () => void) {
  const { address } = useAccount();
  const client = usePublicClient();
  const { writeContract, data: hash, error: txError } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const [phase, setPhase] = useState<Phase>("idle");
  const [revertError, setRevertError] = useState<string | null>(null);
  const pending = useRef<{ tokenId: bigint; price: bigint } | null>(null);
  const lastHash = useRef<string | null>(null);

  function start(tokenId: number, priceEth: string) {
    pending.current = { tokenId: BigInt(tokenId), price: parseEther(priceEth) };
    lastHash.current = null;
    setRevertError(null);
    setPhase("approving");
    writeContract({
      chainId,
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
      const { tokenId, price } = pending.current;
      setPhase("listing");
      client
        ?.simulateContract({
          address: marketplace.address,
          abi: marketplace.abi,
          functionName: "list",
          args: [tokenId, price],
          account: address,
        })
        .then(() =>
          writeContract({
            chainId,
            address: marketplace.address,
            abi: marketplace.abi,
            functionName: "list",
            args: [tokenId, price],
          }),
        )
        .catch(() => {
          setRevertError("The contract rejected this listing — the price is above the resale cap.");
          setPhase("idle");
        });
    } else if (phase === "listing") {
      setPhase("done");
      onListed?.();
    }
  }, [isSuccess, hash]);

  return { phase, error: revertError ?? (txError ? "Listing failed." : null), start };
}
