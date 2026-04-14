/**
 * `registry-shell build` — run `next build` against the user's project.
 *
 * Strategy: `next build` writes to its default `<next-project>/.next`
 * location (inside our node_modules). After a successful build, MOVE that
 * directory to `<user-project>/<paths.buildOutput ?? ".next">`.
 *
 * Why not use Next's `distDir` config? Next silently ignores absolute
 * paths that point outside the Next project dir (the output ends up back
 * in the default location). The env-var approach we tried first worked
 * locally on Windows but failed on Vercel. A post-build move is
 * platform-independent.
 */
import fs from "node:fs"
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

  const shellNextApp = nextAppDir()
  const env = { ...process.env, ...buildEnvVars(loaded) }
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "build", shellNextApp, ...args],
    { stdio: "inherit", env },
  )

  child.on("exit", (code) => {
    if (code !== 0) {
      process.exit(code ?? 1)
    }
    if (loaded) relocateBuildOutput(shellNextApp, loaded.root, loaded.config.paths?.buildOutput)
    process.exit(0)
  })
}

/**
 * Moves `<shellNextApp>/.next` → `<userRoot>/<outputName ?? ".next">`.
 * Idempotent: removes stale destination first. Noop if source is missing
 * (e.g. Next's distDir *did* happen to work) or source and dest are the
 * same path.
 */
function relocateBuildOutput(
  shellNextApp: string,
  userRoot: string,
  outputName: string | undefined,
): void {
  const src = path.join(shellNextApp, ".next")
  const dest = path.resolve(userRoot, outputName ?? ".next")
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
  console.log(`[registry-shell] Build output moved to ${dest}`)
}
