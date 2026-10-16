import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // care-recommendations.ts and predictive-monitoring.ts import
      // @workspace/db at module scope for their DB-backed orchestration
      // functions (not exercised by these unit tests, which only call the
      // exported pure functions) — lib/db throws immediately on import if
      // DATABASE_URL isn't set. A placeholder is enough: no query is ever
      // actually issued in this test run, so nothing really connects.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
