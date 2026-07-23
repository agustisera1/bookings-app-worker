import { defineConfig } from "vitest/config";

// Convención de tests: ver CLAUDE.md § Tests (repo bookings_app).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
