import { previewLoader } from "@shell/lib/preview-loader"

const { Preview } = previewLoader

const fallback = (
  <div className="border border-l-0 border-r-0 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
    No preview available
  </div>
)

export function ComponentPreview({ name }: { name: string }) {
  return <Preview name={name} fallback={fallback} />
}
