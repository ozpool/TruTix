import { type Abi, type Address, type Log } from "viem";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import marketplaceAbi from "@trutix/shared/abis/TicketMarketplace.json";
import { publicClient } from "../chain";
import { backfillClient } from "../chainBackfill";
import { config } from "../config";
import { IndexerState } from "../models";
import { dispatch } from "./dispatch";
import { planScan } from "./planScan";

const POLL_MS = 4_000;
const CHUNK = 10n; // max block span per getContractEvents call (Alchemy free-tier eth_getLogs cap)
const CHUNK_DELAY_MS = 150; // stay under free-tier requests/sec cap during long catch-ups
const CURSOR_KEY = "default";
const TIP_SAFETY = BigInt(config.INDEXER_TIP_SAFETY);
const BACKFILL_MAX_RANGE = BigInt(config.INDEXER_BACKFILL_MAX_RANGE);

type DecodedLog = Log & { eventName: string; args: Record<string, unknown> };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadCursor(head: bigint): Promise<bigint> {
  const doc = await IndexerState.findOne({ key: CURSOR_KEY });
  if (doc) return BigInt(doc.lastBlock);
  // First boot: start from the chain head, matching "watch from latest forward".
  await saveCursor(head);
  return head;
}

async function saveCursor(block: bigint): Promise<void> {
  await IndexerState.updateOne(
    { key: CURSOR_KEY },
    { key: CURSOR_KEY, lastBlock: Number(block) },
    { upsert: true },
  );
}

/// Replay every relevant log in [from, to] in block/log order, then persist the
/// cursor — chunked so a long catch-up never exceeds an RPC's block-range cap.
async function catchUp(
  client: typeof publicClient,
  chunk: bigint,
  chunkDelayMs: number,
  from: bigint,
  to: bigint,
  contracts: Address[],
): Promise<void> {
  const ticketAbi = eventTicketAbi as Abi;
  const mktAbi = marketplaceAbi as Abi;
  for (let start = from; start <= to; start += chunk) {
    const end = start + chunk - 1n > to ? to : start + chunk - 1n;
    const batches = await Promise.all([
      client.getContractEvents({
        address: contracts[0],
        abi: ticketAbi,
        fromBlock: start,
        toBlock: end,
      }),
      client.getContractEvents({
        address: contracts[1],
        abi: mktAbi,
        fromBlock: start,
        toBlock: end,
      }),
    ]);
    const logs = batches.flat() as DecodedLog[];
    logs.sort(
      (a, b) =>
        Number((a.blockNumber ?? 0n) - (b.blockNumber ?? 0n)) ||
        (a.logIndex ?? 0) - (b.logIndex ?? 0),
    );
    for (const log of logs) await dispatch(log.eventName, log.args);
    await saveCursor(end);
    if (end < to) await sleep(chunkDelayMs);
  }
}

/// Durable indexer: a poll loop that advances a persisted block cursor. A
/// restart or RPC blip resumes from the cursor and replays missed blocks, so
/// the Mongo cache cannot silently drift from the chain. No-op without addresses.
///
/// Deep gaps (e.g. after the free-tier host slept) are read from the optional
/// backfill RPC in large chunks; anything within INDEXER_TIP_SAFETY blocks of
/// the head always reads from the primary RPC, since a backfill index can lag
/// behind the true chain tip and silently miss just-mined events.
export function startIndexer(): void {
  const eventTicket = config.EVENT_TICKET_ADDR as Address | undefined;
  const marketplace = config.MARKETPLACE_ADDR as Address | undefined;
  if (!eventTicket || !marketplace) {
    console.warn("Indexer disabled: contract addresses are not configured");
    return;
  }
  const contracts: Address[] = [eventTicket, marketplace];

  void (async () => {
    for (;;) {
      try {
        const head = await publicClient.getBlockNumber();
        let cursor = await loadCursor(head);
        while (cursor < head) {
          const plan = planScan(
            head,
            cursor,
            TIP_SAFETY,
            BACKFILL_MAX_RANGE,
            CHUNK,
            backfillClient !== undefined,
          );
          if (plan.source === "backfill" && backfillClient) {
            await catchUp(backfillClient, BACKFILL_MAX_RANGE, 0, plan.from, plan.to, contracts);
          } else {
            await catchUp(publicClient, CHUNK, CHUNK_DELAY_MS, plan.from, plan.to, contracts);
          }
          cursor = plan.to;
        }
      } catch (error) {
        console.error("Indexer tick failed; retrying next poll", error);
      }
      await sleep(POLL_MS);
    }
  })();
}
