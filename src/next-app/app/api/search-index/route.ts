import { NextResponse } from "next/server"
import { getAllDocs } from "@shell/lib/docs"
import { getAllComponents } from "@shell/lib/components-nav"

export function GET() {
  const docs = getAllDocs().map((doc) => ({
    label: doc.title,
    href: `/docs/${doc.slug}`,
    group: "Documentation",
  }))

  const components = getAllComponents().map((comp) => ({
    label: comp.label,
    href: `/components/${comp.name}`,
    group: "Components",
  }))

  return NextResponse.json([...docs, ...components])
}
