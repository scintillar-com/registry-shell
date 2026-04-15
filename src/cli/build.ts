/**
 * `registry-shell build` — produces a Next.js static export tree in
 * `<user-project>/out/`.
 *
 * Pipeline:
 *   1. Overlay user's public/ onto the shell's bundled public/ (so Next
 *      sees user's registry manifests at /r/*.json, /a11y/*.json, etc.).
 *   2. Run build-time generators that write derived JSON into the merged
 *      public/ — currently just `api/search-index.json`.
 *   3. Run `next build` with `output: "export"` (set in next.config.ts).
 *      Next writes static HTML/JS/CSS to `<shell>/out/`.
 *   4. Copy `<shell>/out/` → `<user-project>/out/`.
 *   5. Restore shell's public/ to its pristine state (remove anything we
 *      added in step 1/2) so repeated builds are idempotent.
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
import { generateSearchIndex } from "./generate-search-index.js"

export async function run(args: string[]): Promise<void> {
  const loaded = loadUserConfig()
  if (!loaded) {
    console.error(
      "[registry-shell] No registry-shell.config.ts found — `build` requires a registry.",
    )
    process.exit(1)
  }

  clearStaleNextCacheIfModeChanged(loaded)
  writeUserSourcesCss(loaded)

  const shellNextApp = nextAppDir()
  const shellPublic = path.join(shellNextApp, "public")
  const userPublic = path.join(loaded.root, "public")

  // Step 1: Snapshot shell's public/ before overlay so we can restore it.
  const shellOwnEntries: Set<string> = new Set(
    fs.existsSync(shellPublic) ? fs.readdirSync(shellPublic) : [],
  )

  // Step 2: Overlay user's public/ onto shell's public/ (user files win).
  const overlaidEntries: string[] = []
  if (fs.existsSync(userPublic)) {
    for (const entry of fs.readdirSync(userPublic)) {
      const src = path.join(userPublic, entry)
      const dest = path.join(shellPublic, entry)
      fs.cpSync(src, dest, { recursive: true, force: true })
      overlaidEntries.push(entry)
    }
  }

  // Apply the shell env vars to THIS process so build-time generators can
  // call `loadResolvedConfig()` (which reads USER_REGISTRY_ROOT etc.).
  // The same env is also forwarded to the spawn child below.
  const env = { ...process.env, ...buildEnvVars(loaded) }
  Object.assign(process.env, buildEnvVars(loaded))

  // Step 3: Pre-build generators (writes into shell's public/ so Next picks up).
  try {
    await generateSearchIndex(loaded, shellPublic)
  } catch (err) {
    console.warn(
      `[registry-shell] search-index generation failed: ${(err as Error).message}`,
    )
  }

  // Step 4: next build (static export — writes to <shellNextApp>/out/).
  const buildChild = spawn(
    process.execPath,
    [NEXT_BIN, "build", shellNextApp, ...args],
    { stdio: "inherit", env },
  )

  buildChild.on("exit", (code) => {
    if (code !== 0) {
      restoreShellPublic(shellPublic, shellOwnEntries, overlaidEntries)
      process.exit(code ?? 1)
    }

    // Step 5: Copy out/ to user project root.
    const src = path.join(shellNextApp, "out")
    const dest = path.resolve(loaded.root, "out")
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
      }
      fs.cpSync(src, dest, { recursive: true })
      // Remove the build output from inside node_modules so it doesn't
      // accumulate stale copies across releases.
      fs.rmSync(src, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
      console.log(`[registry-shell] Static build ready at ${dest}`)
    }

    // Step 6: Restore shell's public/ (remove overlay).
    restoreShellPublic(shellPublic, shellOwnEntries, overlaidEntries)
    process.exit(0)
  })
}

/**
 * Removes anything from `shellPublic` that wasn't there before the overlay.
 * Keeps shell's bundled favicons + anything else that was part of the
 * shipped package. Runs on both success and failure paths.
 */
function restoreShellPublic(
  shellPublic: string,
  shellOwnEntries: Set<string>,
  overlaidEntries: string[],
): void {
  if (!fs.existsSync(shellPublic)) return
  for (const entry of overlaidEntries) {
    if (!shellOwnEntries.has(entry)) {
      // Entry didn't exist before overlay — remove cleanly.
      fs.rmSync(path.join(shellPublic, entry), {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      })
    }
    // Entry existed in shell's own public/ — we overwrote it, can't
    // cleanly restore without reinstalling. Leave it; on next build the
    // user's version replaces it again. Mostly affects favicon.* files
    // the user might customize.
  }
}
