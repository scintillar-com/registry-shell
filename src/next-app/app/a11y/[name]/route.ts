import { NextRequest, NextResponse } from "next/server"
import { registry } from "@shell/registry.config"

/**
 * Serves the user registry's `public/a11y/{name}.json` files. The shell's
 * own `public/` doesn't hold these (they live in the user's project), so a
 * route handler proxies the read through the adapter.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const data = registry?.getA11yData ? await registry.getA11yData(name) : null
  if (!data) {
    return NextResponse.json({ error: "A11y data not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
