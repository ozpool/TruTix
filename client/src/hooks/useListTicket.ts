import { useEffect, useRef, useState } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { chainId, eventTicket, marketplace } from "../contracts";
import { contractErrorName, txErrorMessage } from "../lib/txError";

type Phase = "idle" | "approving" | "listing" | "done";

const LIST_REVERT_MESSAGES: Record<string, string> = {
  PriceAboveCap: "That price is above the resale cap for this ticket.",
  NotApproved: "The marketplace isn't approved to move this ticket yet — try listing again.",
  NotOwner: "You no longer own this ticket.",
  TicketRedeemed: "This ticket has already been redeemed and can't be resold.",
  ZeroPrice: "Enter a price greater than zero.",
};

function listErrorMessage(err: unknown): string {
  const name = contractErrorName(err);
  return (name && LIST_REVERT_MESSAGES[name]) || txErrorMessage(err);
}

/// Listing a ticket is two transactions: approve the marketplace to move the
/// NFT, then create the listing. The listing call is simulated first so any
/// contract rejection surfaces as a readable message instead of a cryptic
/// wallet gas error. Each confirmed tx hash is processed once so the
/// approval's receipt cannot be mistaken for the listing's.
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
        .catch((err) => {
          setRevertError(listErrorMessage(err));
          setPhase("idle");
        });
    } else if (phase === "listing") {
      setPhase("done");
      onListed?.();
    }
  }, [isSuccess, hash]);

  return { phase, error: revertError ?? (txError ? "Listing failed." : null), hash, start };
}
