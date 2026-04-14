/**
 * `registry-shell dev` — run `next dev` against the user's project.
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
  if (loaded) {
    console.log(`[registry-shell] Using config: ${loaded.configPath}`)
  } else {
    console.log(`[registry-shell] No registry-shell.config.ts found — running in shell-only mode.`)
  }

  clearStaleNextCacheIfModeChanged(loaded)
  writeUserSourcesCss(loaded)
  const env = { ...process.env, ...buildEnvVars(loaded) }
  const portArgs = loaded?.config.port ? ["-p", String(loaded.config.port)] : []
  // Webpack by default. Turbopack currently can't compile files reached via
  // the `@user/*` cross-project aliases — it treats them as native Node ESM
  // and crashes on `next/dynamic`. Set UI_SHELL_TURBOPACK=1 to opt in once
  // Turbopack supports this (track https://github.com/vercel/next.js).
  const turbopackArgs = process.env.UI_SHELL_TURBOPACK ? ["--turbopack"] : []
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "dev", nextAppDir(), ...turbopackArgs, ...portArgs, ...args],
    { stdio: "inherit", env },
  )

  child.on("exit", (code) => process.exit(code ?? 0))
}
