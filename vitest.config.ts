import { defineConfig } from "vitest/config"

// Vitest config — scoped to unit tests only. The `tests/` folder is owned
// by Playwright (see playwright.config.ts `testDir: "./tests"`); without an
// explicit `include`, Vitest would also pick up `tests/*.spec.ts` and crash
// on Playwright's `test.describe()`. So we restrict to `src/**/*` and let
// future unit tests live next to the code they cover.
//
// `passWithNoTests` stops CI from failing when no unit tests exist yet —
// CI's job is to catch regressions, not to mandate that tests exist.
export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "tests/**",
      "test-fixtures/**",
    ],
    passWithNoTests: true,
  },
})
