import type { ComponentType, ReactNode } from "react"

/** One entry in the registry's navigation — a UI component or a block. */
export interface ComponentMeta {
  /** URL-safe slug, e.g. `"button"` or `"auth-login"`. */
  name: string
  /** Human-readable title, e.g. `"Button"` or `"Auth Login"`. */
  label: string
  /**
   * `"component"` for low-level UI primitives (Button, Dialog), `"block"` for
   * composed screens/patterns (Auth Login, Data Table). Shell groups these
   * into separate sidebar sections.
   */
  kind: "component" | "block"
}

/** Doc page metadata (frontmatter + slug). Drives the docs sidebar. */
export interface DocMeta {
  /** URL-safe slug, matches the `.mdx` filename without extension. */
  slug: string
  /** Default-locale title (typically English). */
  title: string
  description: string
  /** Sidebar sort order. Lower = higher up. Default 999. */
  order: number
  /** Per-locale titles, e.g. `{ en: "Getting Started", fr: "Démarrage" }`. */
  titles: Record<string, string>
}

/** Full MDX body of a doc for one locale, plus its metadata. */
export interface DocContent {
  meta: Omit<DocMeta, "titles">
  /** Raw MDX string — the shell renders it via `next-mdx-remote`. */
  content: string
}

/**
 * Renders interactive component previews on the detail pages. The registry
 * owns the dynamic-import map (see `sntlr-registry/components/previews/index.ts`
 * for a reference implementation) because Next.js `dynamic()` needs string
 * literal paths at compile time.
 */
export interface PreviewLoader {
  /**
   * Stable wrapper component. Use this in shell code:
   * `<Preview name={compName} fallback={<EmptyState/>} />`. Avoids the
   * `react-hooks/static-components` lint that fires when a component type is
   * looked up inside render.
   */
  Preview: ComponentType<{ name: string; fallback?: ReactNode }>
  /** All names for which `load()` returns a component. */
  names(): string[]
  /** Low-level lookup. Prefer `Preview`; exposed for edge cases. */
  load(name: string): ComponentType | null
}

/** Props the shell passes to an optional custom `HomePage` component. */
export interface HomePageProps {
  /** Slug of the first doc (lowest `order`), so the homepage can link to it. */
  firstDocSlug?: string
}

/**
 * Branding displayed in the shell chrome (header, favicon, HTML title) and on
 * the built-in Getting Started landing. Pure data — safe to import from client
 * components.
 */
export interface GithubConfig {
  owner: string
  repo: string
  label?: string
  showStars?: boolean
}

export interface BrandingConfig {
  /** Full product name, e.g. `"Scintillar UI"`. Used in HTML title. */
  siteName: string
  /** Short breadcrumb label, e.g. `"UI"`. Shown next to the logo. */
  shortName: string
  /** Canonical URL of the deployed registry, e.g. `"https://ui.sntlr.app"`. */
  siteUrl?: string
  /** SEO description. Used in `<meta name="description">`, OG, Twitter. */
  description?: string
  /** OG image URL (1200×630 recommended). */
  ogImage?: string
  /** Twitter handle without the `@`. */
  twitterHandle?: string
  /** Optional GitHub link button in the header. */
  github?: GithubConfig
  /** Accessible alt text for the logo image. */
  logoAlt?: string
  /** Public path to the dark-theme SVG favicon. */
  faviconDark?: string
  /** Public path to the light-theme SVG favicon. */
  faviconLight?: string
  /** Public path to a fallback `.ico` favicon. */
  faviconIco?: string
}

/**
 * Client-safe slice of a registry — bundles everything the shell renders in
 * the browser (without pulling in the server-only adapter that uses `fs`).
 * Wire this in `ui-registry/registry.client.ts`.
 *
 * A registry package typically exposes this via a `client.ts` module that
 * re-exports `branding`, `previewLoader`, a default `HomePage`, and optional
 * `extraTranslations`. See `sntlr-registry/client.ts` for a reference.
 */
export interface RegistryClient {
  branding: BrandingConfig
  previewLoader: PreviewLoader
  /**
   * Optional custom homepage component. When set, the shell's `/` route
   * renders this instead of the built-in Getting Started / generic index.
   * When `undefined`/`null`, the shell uses `GenericIndexPage` (a plain
   * component/block listing).
   */
  HomePage?: ComponentType<HomePageProps> | null
  /**
   * Locale → key → value dictionaries merged into the shell's i18n table.
   * Use this to ship marketing/homepage copy; the shell owns the generic UI
   * keys (sidebar, header, search, a11y, etc.). Invariant: if `HomePage` is
   * set, this must include every key the homepage references.
   */
  extraTranslations?: Record<string, Record<string, string>>
}

/**
 * The complete server-side contract the shell consumes. A registry package
 * implements this (typically in `adapter.ts`) and the shell imports the
 * default export via `ui-registry/registry.config.ts`.
 *
 * All filesystem reads, registry-JSON serving, and MDX parsing live here —
 * the shell never touches the registry's files directly. This is what makes
 * the shell swappable across arbitrary registries.
 */
export interface RegistryAdapter {
  /**
   * Full list of navigable items (components + blocks). Typically scans the
   * registry's `components/ui` and `registry/STYLE/blocks` folders at build
   * time, where STYLE is e.g. "new-york" or "default".
   */
  getAllComponents(): ComponentMeta[]

  /** Full list of MDX docs with their frontmatter. */
  getAllDocs(): DocMeta[]

  /**
   * Return doc content for one slug, preferring the requested locale. Fall
   * back to the default locale when the localized file doesn't exist. Return
   * `null` when the slug is unknown so the shell can `notFound()`.
   */
  getDocBySlug(slug: string, locale?: string): DocContent | null

  /** Return `{ [locale]: rawMdx }` for all locales a doc is translated into. */
  getDocAllLocales(slug: string): Record<string, string>

  /**
   * Raw source of a component/block file for the "Code" tab. Should check
   * both the component directory and the primitives/blocks directories.
   * Return `null` if unknown.
   */
  getComponentSource(name: string): string | null

  /**
   * Return the shadcn-format JSON for a registry item. Usually reads the
   * pre-built `public/r/{name}.json` produced by `shadcn build`. Accepts the
   * slug with or without a trailing `.json`.
   */
  getRegistryItem(name: string): Promise<unknown | null>

  /**
   * Return the a11y metadata JSON for a component. Powers the Accessibility
   * tab. Convention: `public/a11y/{name}.json` generated from
   * `content/a11y/{name}.yaml` by the registry's `generate:a11y` script.
   */
  getA11yData?(name: string): Promise<unknown | null>

  /**
   * Return the test summary JSON for a component. Powers the Tests tab.
   * Convention: `public/tests/{name}.json` generated by `generate:tests`.
   */
  getTestData?(name: string): Promise<unknown | null>

  /**
   * Return the prop-documentation JSON for a component. Powers the props
   * table inside the Docs tab. Convention: `public/props/{name}.json`
   * generated by `generate:props`.
   */
  getPropsData?(name: string): Promise<unknown | null>

  previewLoader: PreviewLoader
  branding: BrandingConfig

  /** See `RegistryClient.HomePage`. */
  homePage?: ComponentType<HomePageProps> | null
  /** See `RegistryClient.extraTranslations`. */
  extraTranslations?: Record<string, Record<string, string>>
}
