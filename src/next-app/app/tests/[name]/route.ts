import { NextRequest, NextResponse } from "next/server"
import { registry } from "@shell/registry.config"

/**
 * Serves the user registry's `public/tests/{name}.json` files via the
 * adapter, so the Tests tab can fetch them through standard URLs even though
 * the files live in the user's project rather than the shell's `public/`.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const data = registry?.getTestData ? await registry.getTestData(name) : null
  if (!data) {
    return NextResponse.json({ error: "Test data not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
