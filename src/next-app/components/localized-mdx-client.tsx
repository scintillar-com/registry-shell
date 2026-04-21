"use client"

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote"
import { useLocale } from "@shell/lib/i18n"
import { mdxHeadings } from "@shell/components/heading-anchor"

/**
 * Client wrapper that picks one of the serialized locale payloads produced
 * by the server-side `LocalizedMdx` and renders it via client-side
 * `MDXRemote`. Evaluation happens in the browser with one React instance,
 * avoiding the Next RSC / userland React jsx-runtime boundary crash.
 *
 * The heading-anchor components render client-side so their onClick
 * handlers (history push, smooth-scroll, clipboard copy) bind correctly.
 */
export function LocalizedMdxClient({
  serialized,
}: {
  serialized: Record<string, MDXRemoteSerializeResult>
}) {
  const { locale } = useLocale()
  const active =
    serialized[locale] ?? serialized.en ?? Object.values(serialized)[0]
  if (!active) return null
  return <MDXRemote {...active} components={mdxHeadings} />
}
