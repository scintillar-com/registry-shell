import { Hello } from "@/components/ui/hello"

export function HelloPreview() {
  return (
    <div data-testid="hello-preview" className="p-8 text-center">
      <Hello name="smoke-test" />
    </div>
  )
}
