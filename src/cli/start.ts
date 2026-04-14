/**
 * `registry-shell start` — run `next start` for a prior `registry-shell build`.
 */
import { spawn } from "node:child_process"
import { NEXT_BIN, buildEnvVars, loadUserConfig, nextAppDir } from "./shared.js"

export async function run(args: string[]): Promise<void> {
  const loaded = loadUserConfig()
  const env = { ...process.env, ...buildEnvVars(loaded) }
  const portArgs = loaded?.config.port ? ["-p", String(loaded.config.port)] : []
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", nextAppDir(), ...portArgs, ...args],
    { stdio: "inherit", env },
  )
  child.on("exit", (code) => process.exit(code ?? 0))
}
