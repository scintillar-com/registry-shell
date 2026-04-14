/**
 * `registry-shell build` — run `next build` against the user's project.
 */
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
  const env = { ...process.env, ...buildEnvVars(loaded) }
  const child = spawn(process.execPath, [NEXT_BIN, "build", nextAppDir(), ...args], {
    stdio: "inherit",
    env,
  })
  child.on("exit", (code) => process.exit(code ?? 0))
}
