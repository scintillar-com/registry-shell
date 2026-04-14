/**
 * Virtual modules resolved by next.config.ts based on `USER_REGISTRY_ROOT`.
 * At build time they point at the user's files; if the user has none, they
 * fall back to shell-bundled stubs under `fallback/`.
 */

declare module "@user/previews" {
  import type { PreviewLoader } from "@shell/lib/registry-adapter"
  export const previewLoader: PreviewLoader
}

declare module "@user/homepage" {
  import type { ComponentType } from "react"
  import type { HomePageProps } from "@shell/lib/registry-adapter"
  const HomePage: ComponentType<HomePageProps>
  export default HomePage
}
