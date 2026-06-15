import { useAccount, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useResale } from "../hooks/useResale";
import { chainId, marketplace } from "../contracts";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { StoreIcon } from "../components/ui/icons";

/// Public marketplace: every active resale listing with a buy button. The price
/// is the on-chain, cap-enforced amount; buying sends exactly that value.
export function Resale() {
  const { isConnected } = useAccount();
  const { data: listings, isLoading } = useResale();
  const { writeContract, isPending, data: hash } = useWriteContract();

  function buy(tokenId: number, price: string) {
    writeContract({
      chainId,
      address: marketplace.address,
      abi: marketplace.abi,
      functionName: "buy",
      args: [BigInt(tokenId)],
      value: BigInt(price),
    });
  }

  if (isLoading)
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Spinner /> Loading…
      </p>
    );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Resale marketplace</h1>
        <p className="text-sm text-slate-400">
          Every price here is capped on-chain — no scalper markups get through.
        </p>
      </header>

      {listings?.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-8 w-8" />}
          title="No active listings."
          hint="When someone lists a ticket for resale, it shows up here."
        />
      ) : (
        <div className="grid gap-3">
          {listings?.map((l) => (
            <Card key={l.tokenId} className="flex items-center justify-between gap-4 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-display text-base">Ticket #{l.tokenId}</p>
                  <Badge tone="brand">Event #{l.eventId}</Badge>
                </div>
                <p className="font-mono text-sm text-citrus-300">
                  {formatEther(BigInt(l.price))} ETH
                </p>
              </div>
              {isConnected ? (
                <Button size="sm" loading={isPending} onClick={() => buy(l.tokenId, l.price)}>
                  Buy
                </Button>
              ) : (
                <span className="text-sm text-slate-500">Connect to buy</span>
              )}
            </Card>
          ))}
        </div>
      )}

      {hash && (
        <TxStatus tone="success">Purchase submitted. Transaction {hash.slice(0, 10)}…</TxStatus>
      )}
    </section>
  );
}
