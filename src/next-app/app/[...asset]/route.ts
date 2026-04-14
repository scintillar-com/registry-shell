/**
 * Catch-all route that serves arbitrary files from the user registry's
 * `public/` directory. Fires only when no other app route matches, so it
 * doesn't interfere with static routes like `/`, `/docs/...`, `/r/...`,
 * etc. The shell's own `public/` assets are served first by Next.js's
 * built-in static handler; this route handles the user's project's assets
 * since Next only serves the bundled package's `public/`.
 *
 * Examples of what this enables:
 *   - `![foo](./my-image.png)` inside user MDX resolving to
 *     `{userRoot}/public/my-image.png`
 *   - Custom favicons referenced in `branding.faviconDark` that live under
 *     `{userRoot}/public/`
 */
import "server-only"
import fs from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await params
  const userRoot = process.env.USER_REGISTRY_ROOT
  if (!userRoot || asset.length === 0) {
    return new Response("Not found", { status: 404 })
  }

  // Reject traversal.
  if (asset.some((seg) => seg.includes("..") || seg.includes("\0"))) {
    return new Response("Forbidden", { status: 403 })
  }

  const publicDir = path.join(userRoot, "public")
  const filePath = path.join(publicDir, ...asset)

  // Defense-in-depth: make sure the resolved path is still under public/.
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(publicDir) + path.sep)) {
    return new Response("Forbidden", { status: 403 })
  }

  try {
    const stat = await fs.promises.stat(resolved)
    if (!stat.isFile()) return new Response("Not found", { status: 404 })
    const body = await fs.promises.readFile(resolved)
    const type = MIME[path.extname(resolved).toLowerCase()] ?? "application/octet-stream"
    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
