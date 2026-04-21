/**
 * Server component: serialize each locale's MDX source into a compiled JS
 * payload using `next-mdx-remote/serialize`, then hand the map of payloads
 * to a client wrapper that picks the active locale and evaluates it with
 * the client-side `MDXRemote`.
 *
 * Why not the /rsc subpath's `MDXRemote` or `compileMDX`? Both do a
 * `new Function()` eval on the server with an injected jsx-runtime loaded
 * from userland React. In Next 15.5 dev mode that eval runs under Next's
 * RSC context where the injected jsx-runtime's `ReactSharedInternals`
 * resolves to `undefined`; the React 19 owner-stacks instrumentation then
 * crashes with
 *   "Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')".
 * Serialization produces a plain JS string (no React involved), and the
 * actual eval happens in the browser with a single client React, dodging
 * the cross-boundary problem entirely. Static builds take a different RSC
 * codepath that doesn't hit the crash, which is why `registry-shell build`
 * works even without this split.
 */
import { serialize } from "next-mdx-remote/serialize"
import remarkGfm from "remark-gfm"
import { LocalizedMdxClient } from "@shell/components/localized-mdx-client"

const serializeOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
}

export async function LocalizedMdx({
  locales,
}: {
  locales: Record<string, string>
}) {
  const entries = await Promise.all(
    Object.entries(locales).map(async ([loc, source]) => {
      const serialized = await serialize(source, serializeOptions)
      return [loc, serialized] as const
    })
  )
  return <LocalizedMdxClient serialized={Object.fromEntries(entries)} />
}
