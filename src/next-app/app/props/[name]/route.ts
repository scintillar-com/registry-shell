import { NextRequest, NextResponse } from "next/server"
import { registry } from "@shell/registry.config"

/**
 * Serves the user registry's `public/props/{name}.json` files via the
 * adapter, so the props table inside the Docs tab can fetch them through a
 * stable URL even though the files live in the user's project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const data = registry?.getPropsData ? await registry.getPropsData(name) : null
  if (!data) {
    return NextResponse.json({ error: "Props data not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
