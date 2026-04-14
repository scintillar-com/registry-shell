#!/usr/bin/env node
/**
 * @sntlr/registry-shell CLI entry.
 *
 * Commands:
 *   init    Scaffold registry-shell.config.ts and add a script to package.json.
 *   dev     Run `next dev` pointed at the user's current directory.
 *   build   Run `next build` pointed at the user's current directory.
 *   start   Run `next start` for a built shell.
 */

const USAGE = `Usage: registry-shell <command> [args]

Commands:
  init            Scaffold registry-shell.config.ts in the current project.
  dev             Start the shell in dev mode on http://localhost:3000.
  build           Build the shell for production.
  start           Start the production server against a prior build.
`

async function main() {
  const [, , cmd, ...args] = process.argv

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(USAGE)
    process.exit(0)
  }

  switch (cmd) {
    case "init":
      await (await import("./init.js")).run(args)
      break
    case "dev":
      await (await import("./dev.js")).run(args)
      break
    case "build":
      await (await import("./build.js")).run(args)
      break
    case "start":
      await (await import("./start.js")).run(args)
      break
    default:
      console.error(`Unknown command: ${cmd}\n`)
      console.log(USAGE)
      process.exit(1)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
