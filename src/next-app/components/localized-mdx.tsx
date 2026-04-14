/**
 * Server component: pre-renders each locale's MDX into a React tree using
 * `next-mdx-remote/rsc`, then hands the keyed map to a client wrapper that
 * picks the active locale. Lets us keep client-side locale switching without
 * the "MDXRemote is an async Client Component" error that fires when /rsc
 * runs inside a "use client" boundary.
 */
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { mdxHeadings } from "@shell/components/heading-anchor"
import { LocalizedMdxClient } from "@shell/components/localized-mdx-client"

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
}

export function LocalizedMdx({ locales }: { locales: Record<string, string> }) {
  const rendered: Record<string, React.ReactNode> = {}
  for (const [loc, source] of Object.entries(locales)) {
    rendered[loc] = (
      <MDXRemote source={source} options={mdxOptions} components={mdxHeadings} />
    )
  }
  return <LocalizedMdxClient rendered={rendered} />
}
