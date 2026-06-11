import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Test files share Mongoose's single global connection, so run them one at a
    // time rather than in parallel workers.
    fileParallelism: false,
  },
});
