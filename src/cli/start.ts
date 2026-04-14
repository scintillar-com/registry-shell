/**
 * `registry-shell start` — run `next start` for a prior `registry-shell build`.
 *
 * Build writes `.next/` to the user's project root (so Vercel / Netlify /
 * generic Next hosts find it). `next start` expects it at its default
 * location inside the Next project dir. Move it back before starting.
 * Safe to run even if the move has already happened on a prior start.
 */
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { NEXT_BIN, buildEnvVars, loadUserConfig, nextAppDir } from "./shared.js"

export async function run(args: string[]): Promise<void> {
  const loaded = loadUserConfig()
  const env = { ...process.env, ...buildEnvVars(loaded) }
  const portArgs = loaded?.config.port ? ["-p", String(loaded.config.port)] : []
  const shellNextApp = nextAppDir()

  if (loaded) {
    restoreBuildOutput(shellNextApp, loaded.root, loaded.config.paths?.buildOutput)
  }

  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", shellNextApp, ...portArgs, ...args],
    { stdio: "inherit", env },
  )
  child.on("exit", (code) => process.exit(code ?? 0))
}

/**
 * Inverse of build.ts's relocation: moves `<userRoot>/<buildOutput>` back
 * to `<shellNextApp>/.next` so `next start` can find it. Noop when the
 * user-side `.next` is missing — we assume they ran `registry-shell start`
 * against a shell-side build or are otherwise in a good state.
 */
function restoreBuildOutput(
  shellNextApp: string,
  userRoot: string,
  outputName: string | undefined,
): void {
  const dest = path.join(shellNextApp, ".next")
  const src = path.resolve(userRoot, outputName ?? ".next")
  if (src === dest) return
  if (!fs.existsSync(src)) return

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    })
  }
  fs.renameSync(src, dest)
}
