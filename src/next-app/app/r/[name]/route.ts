import { NextRequest, NextResponse } from "next/server"
import { registry } from "@shell/registry.config"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const data = registry ? await registry.getRegistryItem(name) : null
  if (!data) {
    return NextResponse.json({ error: "Registry item not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
