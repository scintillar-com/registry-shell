# @sntlr/registry-shell

A generic Next.js viewer for shadcn-compatible component registries. Drop a
single config file into your registry project, run one command, and get a
full components + blocks + docs site on `localhost:3000` — no wiring, no
shell code to fork.

## Quickstart

```bash
cd my-registry/
npm install -D @sntlr/registry-shell
npx registry-shell init      # scaffolds registry-shell.config.ts + scripts
npm run shell                # boots the shell against your project
```

Visit <http://localhost:3000> — you'll see your components, blocks, and MDX
docs rendered with the shell's chrome (sidebar, topbar, locale toggle, dark
mode, install command, preview + source tabs).

## Configuration

Edit `registry-shell.config.ts` at the root of your registry:

```ts
import { defineConfig } from "@sntlr/registry-shell"

export default defineConfig({
  branding: {
    siteName: "My UI",
    shortName: "UI",
    siteUrl: "https://ui.example.com",
    github: { owner: "my-org", repo: "my-ui" },
  },

  // All path overrides are optional — these are the defaults:
  // paths: {
  //   components:   "components/ui",
  //   blocks:       "registry/new-york/blocks",
  //   previews:     "components/previews/index.ts",
  //   docs:         "content/docs",
  //   registryJson: "public/r",
  //   globalCss:    "./styles/theme.css",  // optional, see "Custom CSS"
  // },

  // Optional custom homepage (relative to this file):
  // homePage: "./components/homepage",
})
```

The only required field is `branding`. Everything else follows shadcn
conventions out of the box.

## How it works

The shell is a published Next.js app. The CLI (`registry-shell`) resolves
the bundled app inside `node_modules/@sntlr/registry-shell`, injects
environment variables pointing at your project (`USER_REGISTRY_ROOT`,
`USER_CONFIG_PATH`), and spawns `next dev` / `next build` / `next start`
against it.

A convention-based adapter inside the shell reads your filesystem at server
startup: `components/ui/*.tsx` for components, `registry/new-york/blocks/*/`
for blocks, `content/docs/*.mdx` for docs, `public/r/*.json` for the
shadcn-compatible registry JSON. Everything is pull-based — the shell never
writes to your project (except a `.next` build cache inside its own install
location).

Previews are imported from your project's `components/previews/index.ts` via
a Next.js alias, so `next/dynamic()` with string-literal paths keeps working.
A custom homepage module (if you set `homePage` in the config) is loaded the
same way.

## Commands

| Command                  | What it does                                        |
|--------------------------|-----------------------------------------------------|
| `registry-shell init`    | Scaffold `registry-shell.config.ts` + npm scripts   |
| `registry-shell dev`     | Dev server on `localhost:3000`                      |
| `registry-shell build`   | Production `next build`                             |
| `registry-shell start`   | `next start` against a prior build                  |

If your registry has no config file, the shell runs in "shell-only" mode and
renders its built-in getting-started docs so you can preview the chrome
before wiring anything up.

## Custom CSS / theme tokens

To add brand fonts, override design tokens, or register extra
Tailwind `@source` scan paths, set `paths.globalCss` to a `.css` file in
your project:

```css
/* styles/theme.css */
@font-face {
  font-family: "Brand Sans";
  src: url("/fonts/brand-sans.woff2") format("woff2");
}

/* Override the shell's primary color (light + dark) */
:root { --primary: oklch(0.6 0.2 280); }
.dark { --primary: oklch(0.75 0.18 280); }

/* Scan an extra directory for Tailwind utilities */
@source "../content/marketing";
```

The file is `@import`ed at the very end of the shell's `globals.css`, so
your `:root` token redefinitions win the cascade against the shell's
defaults. Edits require a CLI restart to pick up (the CSS path is resolved
at boot); the file's contents are hot-reloaded as usual.

## Advanced: custom adapters

For non-convention registries (database-backed metadata, non-MDX docs, etc.)
point `adapter` at a TypeScript module:

```ts
// registry-shell.config.ts
export default defineConfig({
  branding: { ... },
  adapter: "./custom-adapter",
})
```

```ts
// custom-adapter.ts
import type { ResolvedShellConfig } from "@sntlr/registry-shell"

export default function (_resolved: ResolvedShellConfig) {
  return {
    // Override only the methods you need — the rest fall through to the
    // convention-based defaults.
    getAllComponents: () => [
      { name: "my-button", label: "Button", kind: "component" as const },
    ],
  }
}
```

The factory is called once at server startup with the resolved config. It
may return any subset of the adapter interface; omitted methods use the
defaults.

## Requirements

- Node.js ≥ 18.18
- Your project uses Next.js 15 conventions (or at least its `public/`,
  `components/`, `content/` layout — the shell doesn't care if you use
  Next.js itself).

## Deploying to Vercel

The shell's `registry-shell build` writes its Next.js output to
`<your-project>/.next`, so any Next-aware host (Vercel, Netlify's Next runtime,
self-hosted Node, etc.) finds it where they expect. On Vercel specifically:

1. **Add `next` to your project's devDependencies.** Vercel auto-detects
   Next.js by scanning `package.json`; without a direct `next` entry it may
   miss the framework and default to static hosting.
   ```bash
   npm install -D next
   ```
2. **In the Vercel dashboard** (New Project → your repo), set:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run shell:build` (or `registry-shell build`)
   - **Output Directory**: leave blank (defaults to `.next`)
   - **Install Command**: leave default
3. Deploy. Vercel runs your build command, Next writes `.next/` at the
   project root, and Vercel picks it up like a standard Next.js project.

`registry-shell start` also respects the same output location, so
self-hosted deployments work with `npm run shell:build && npm run shell:start`.

## Releasing

Publishing is tag-triggered via GitHub Actions. To cut a release:

```bash
npm version patch          # or minor / major — bumps package.json, commits, tags
git push --follow-tags     # pushes the commit + the new tag together
```

The push of `v*` fires `.github/workflows/publish.yml`, which reruns lint +
type-check + tests, verifies the tag matches `package.json`'s version, and
publishes to npm with provenance. Requires an `NPM_TOKEN` secret in the
repo (npm automation token with write access to the `@sntlr` scope).

Every push to `main` and every PR also runs `.github/workflows/test.yml`
(lint, type-check, build, unit tests) — that's the gate the release
workflow leans on, so green there means a tag push will publish cleanly.

## License

MIT
