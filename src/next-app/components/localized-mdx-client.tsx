"use client"

import type { ReactNode } from "react"
import { useLocale } from "@shell/lib/i18n"

/**
 * Client wrapper that picks one of the pre-rendered locale trees produced by
 * the server-side `LocalizedMdx`. The trees are React nodes, not strings, so
 * locale switching is a tree swap with no MDX recompilation.
 */
export function LocalizedMdxClient({ rendered }: { rendered: Record<string, ReactNode> }) {
  const { locale } = useLocale()
  return <>{rendered[locale] ?? rendered.en ?? Object.values(rendered)[0] ?? null}</>
}
