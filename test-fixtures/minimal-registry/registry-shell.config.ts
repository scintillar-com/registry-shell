import { defineConfig } from "@sntlr/registry-shell"

/**
 * Smallest-viable registry used to smoke-test the shell. One component, one
 * doc, no homepage, no blocks. Proves the shell can host a registry that
 * isn't `@sntlr/registry`.
 */
export default defineConfig({
  branding: {
    siteName: "Minimal Registry",
    shortName: "MIN",
    siteUrl: "http://localhost:3100",
    description: "Test fixture for the shell's Playwright smoke suite.",
  },
  port: 3100,
})
