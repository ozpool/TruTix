import { useAccount, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useResale } from "../hooks/useResale";
import { marketplace } from "../contracts";

/// Public marketplace: every active resale listing with a buy button. The price
/// is the on-chain, cap-enforced amount; buying sends exactly that value.
export function Resale() {
  const { isConnected } = useAccount();
  const { data: listings, isLoading } = useResale();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function buy(tokenId: number, price: string) {
    writeContract({
      address: marketplace.address,
      abi: marketplace.abi,
      functionName: "buy",
      args: [BigInt(tokenId)],
      value: BigInt(price),
    });
  }

  if (isLoading) return <p className="text-slate-400">Loading…</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Resale marketplace</h1>
      {listings?.length === 0 && <p className="text-slate-400">No active listings.</p>}
      <div className="space-y-3">
        {listings?.map((l) => (
          <div
            key={l.tokenId}
            className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3"
          >
            <div>
              <p className="font-semibold">Ticket #{l.tokenId}</p>
              <p className="text-sm text-slate-400">
                Event #{l.eventId} · {formatEther(BigInt(l.price))} ETH
              </p>
            </div>
            {isConnected ? (
              <button
                className="rounded bg-sky-500 px-4 py-2 text-sm font-medium disabled:opacity-50"
                disabled={isPending}
                onClick={() => buy(l.tokenId, l.price)}
              >
                Buy
              </button>
            ) : (
              <span className="text-sm text-slate-500">Connect to buy</span>
            )}
          </div>
        ))}
      </div>
      {hash && (
        <p className="text-sm text-emerald-400">Purchase submitted. Tx {hash.slice(0, 10)}…</p>
      )}
    </section>
  );
}
