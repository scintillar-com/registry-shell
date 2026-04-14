/**
 * `registry-shell build` — run `next build` against the user's project.
 *
 * Writes the Next build output to `<user-project>/.next` via `distDir` so
 * generic Next.js hosts (Vercel, self-hosted) find it where they expect.
 * Without this, the output would land inside
 * `node_modules/@sntlr/registry-shell/src/next-app/.next` and no external
 * host could discover it.
 */
import path from "node:path"
import { spawn } from "node:child_process"
import {
  NEXT_BIN,
  buildEnvVars,
  clearStaleNextCacheIfModeChanged,
  loadUserConfig,
  nextAppDir,
  writeUserSourcesCss,
} from "./shared.js"

export async function run(args: string[]): Promise<void> {
  const loaded = loadUserConfig()
  clearStaleNextCacheIfModeChanged(loaded)
  writeUserSourcesCss(loaded)
  const userDistDir = loaded ? path.resolve(loaded.root, ".next") : undefined
  const env = {
    ...process.env,
    ...buildEnvVars(loaded),
    ...(userDistDir ? { USER_DIST_DIR: userDistDir } : {}),
  }
  const child = spawn(process.execPath, [NEXT_BIN, "build", nextAppDir(), ...args], {
    stdio: "inherit",
    env,
  })
  child.on("exit", (code) => process.exit(code ?? 0))
}
