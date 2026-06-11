import { config } from "./config";
import { connectDb } from "./db";
import { createApp } from "./app";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
