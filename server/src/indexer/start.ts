import { type Abi, type Address, type Log } from "viem";
import eventTicketAbi from "@trutix/shared/abis/EventTicket.json";
import marketplaceAbi from "@trutix/shared/abis/TicketMarketplace.json";
import { publicClient } from "../chain";
import { config } from "../config";
import { IndexerState } from "../models";
import { dispatch } from "./dispatch";

const POLL_MS = 4_000;
const CHUNK = 10n; // max block span per getContractEvents call (Alchemy free-tier eth_getLogs cap)
const CHUNK_DELAY_MS = 150; // stay under free-tier requests/sec cap during long catch-ups
const CURSOR_KEY = "default";

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
async function catchUp(from: bigint, to: bigint, contracts: Address[]): Promise<void> {
  const ticketAbi = eventTicketAbi as Abi;
  const mktAbi = marketplaceAbi as Abi;
  for (let start = from; start <= to; start += CHUNK) {
    const end = start + CHUNK - 1n > to ? to : start + CHUNK - 1n;
    const batches = await Promise.all([
      publicClient.getContractEvents({
        address: contracts[0],
        abi: ticketAbi,
        fromBlock: start,
        toBlock: end,
      }),
      publicClient.getContractEvents({
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
    if (end < to) await sleep(CHUNK_DELAY_MS);
  }
}

/// Durable indexer: a poll loop that advances a persisted block cursor. A
/// restart or RPC blip resumes from the cursor and replays missed blocks, so
/// the Mongo cache cannot silently drift from the chain. No-op without addresses.
export function startIndexer(): void {
  const eventTicket = config.EVENT_TICKET_ADDR as Address | undefined;
  const marketplace = config.MARKETPLACE_ADDR as Address | undefined;
  if (!eventTicket || !marketplace) {
    console.warn("Indexer disabled: contract addresses are not configured");
    return;
  }

  void (async () => {
    for (;;) {
      try {
        const head = await publicClient.getBlockNumber();
        const cursor = await loadCursor(head);
        if (head > cursor) {
          await catchUp(cursor + 1n, head, [eventTicket, marketplace]);
        }
      } catch (error) {
        console.error("Indexer tick failed; retrying next poll", error);
      }
      await sleep(POLL_MS);
    }
  })();
}
