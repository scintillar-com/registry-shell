import "@shell/app/globals.css"

/**
 * Minimal layout for Playwright visual snapshots.
 * No header, sidebar, or chrome — just the component.
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
