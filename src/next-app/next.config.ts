import type { NextConfig } from "next"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const USER_ROOT = process.env.USER_REGISTRY_ROOT

/**
 * Resolve a virtual `@user/*` alias to the user's file when it exists, else
 * to a shell-bundled fallback under `fallback/`. Called once at Next boot.
 */
function toPosix(p: string): string {
  // Turbopack on Windows rejects backslash absolute paths.
  return p.replace(/\\/g, "/")
}

/** Common ancestor directory of two absolute paths. */
function findCommonRoot(a: string, b: string): string {
  const pa = path.resolve(a).split(path.sep)
  const pb = path.resolve(b).split(path.sep)
  const common: string[] = []
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    if (pa[i] !== pb[i]) break
    common.push(pa[i])
  }
  return common.join(path.sep) || path.sep
}

function resolveUserModule(relativePath: string, fallback: string): string {
  if (USER_ROOT) {
    // Try a few extensions since users may write .ts or .tsx.
    const candidates = [relativePath, `${relativePath}.ts`, `${relativePath}.tsx`]
    for (const c of candidates) {
      const abs = path.isAbsolute(c) ? c : path.join(USER_ROOT, c)
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return toPosix(abs)
      const indexTs = path.join(abs, "index.ts")
      if (fs.existsSync(indexTs)) return toPosix(indexTs)
      const indexTsx = path.join(abs, "index.tsx")
      if (fs.existsSync(indexTsx)) return toPosix(indexTsx)
    }
  }
  return toPosix(path.join(HERE, fallback))
}

const USER_PREVIEWS = resolveUserModule("components/previews", "fallback/previews.ts")

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,

  // Next's file tracer figures out which node_modules files each
  // serverless function needs. With pnpm (and our setup, where Next
  // runs from inside node_modules), the tracer can't walk pnpm's
  // virtual store without knowing the real project root. Point it at
  // the user's project — that's the dir that contains `node_modules/.pnpm`
  // on Vercel and any other pnpm-installed host.
  ...(USER_ROOT ? { outputFileTracingRoot: toPosix(USER_ROOT) } : {}),

  // When installed as an external package (link:../registry-shell, npm, etc.),
  // the shell's TSX lives under the user's node_modules and Next won't
  // transpile it by default. The registry can list additional packages via
  // `transpilePackages` in its config (CLI forwards as USER_TRANSPILE_PACKAGES).
  transpilePackages: [
    "@sntlr/registry-shell",
    ...(process.env.USER_TRANSPILE_PACKAGES
      ? process.env.USER_TRANSPILE_PACKAGES.split(",").filter(Boolean)
      : []),
  ],

  // Turbopack root: walk up until we find a dir that contains both the shell
  // package and the user's project. For a pnpm workspace setup that's the
  // workspace root. Falls back to process.cwd() (which is the user's project
  // when run via `registry-shell dev`).
  turbopack: {
    root: process.env.TURBOPACK_ROOT
      ? toPosix(process.env.TURBOPACK_ROOT)
      : toPosix(findCommonRoot(HERE, USER_ROOT ?? process.cwd())),
    resolveAlias: {
      "@user/previews": USER_PREVIEWS,
    },
  },

  webpack: (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@user/previews": USER_PREVIEWS,
      // Shell's internal alias — its own files.
      "@shell": toPosix(HERE),
      // shadcn convention: user files use `@/` for their own project root.
      ...(USER_ROOT ? { "@": toPosix(USER_ROOT) } : {}),
    }
    return config
  },
}

export default nextConfig
