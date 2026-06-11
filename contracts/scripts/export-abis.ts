import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { artifacts } from "hardhat";

const CONTRACTS = ["EventTicket", "TicketMarketplace"];
const OUT_DIR = join(__dirname, "..", "..", "shared", "abis");

/// Write each contract's ABI to the shared workspace so the server and client
/// import one source of truth.
async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const name of CONTRACTS) {
    const { abi } = await artifacts.readArtifact(name);
    writeFileSync(join(OUT_DIR, `${name}.json`), `${JSON.stringify(abi, null, 2)}\n`);
    console.log(`Exported ${name} ABI`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
