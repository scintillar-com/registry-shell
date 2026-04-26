import "./preview.css"

/**
 * Minimal layout for isolated component previews.
 *
 * Two consumers:
 *  - The inline `/components/[name]` page renders this route inside an
 *    iframe so previews aren't polluted by shell chrome (custom scrollbar,
 *    html font-size clamp, prose helpers, marquee/bento animation
 *    classes, etc.).
 *  - Playwright visual-snapshot tests target this same route directly.
 *
 * The imported `preview.css` is a deliberate subset of `globals.css`:
 * Tailwind + theme tokens + base layer only. Anything that would cause a
 * preview to render differently from a downstream consumer's app is
 * excluded by design.
 */
export default function SnapshotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-4 bg-background text-foreground font-sans">
      {children}
    </div>
  )
}
