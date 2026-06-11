import { config } from "./config";
import { connectDb } from "./db";
import { createApp } from "./app";
import { startIndexer } from "./indexer/start";

async function main() {
  await connectDb();
  startIndexer();
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
