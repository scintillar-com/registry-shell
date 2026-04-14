/**
 * `registry-shell start` — run `next start` for a prior `registry-shell build`.
 *
 * Mirrors build.ts: passes `USER_DIST_DIR` pointing at `<user-project>/.next`
 * so `next start` reads the build output from where build.ts wrote it.
 */
import path from "node:path"
import { spawn } from "node:child_process"
import { NEXT_BIN, buildEnvVars, loadUserConfig, nextAppDir } from "./shared.js"

export async function run(args: string[]): Promise<void> {
  const loaded = loadUserConfig()
  const userDistDir = loaded
    ? path.resolve(loaded.root, loaded.config.paths?.buildOutput ?? ".next")
    : undefined
  const env = {
    ...process.env,
    ...buildEnvVars(loaded),
    ...(userDistDir ? { USER_DIST_DIR: userDistDir } : {}),
  }
  const portArgs = loaded?.config.port ? ["-p", String(loaded.config.port)] : []
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", nextAppDir(), ...portArgs, ...args],
    { stdio: "inherit", env },
  )
  child.on("exit", (code) => process.exit(code ?? 0))
}
