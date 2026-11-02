# Porla Web UI

The web interface for [Porla](https://github.com/porla/porla), a BitTorrent client. A single-page app that talks to
Porla's JSON-RPC API. Porla downloads a release zip of this UI and serves it, so the UI must work with older Porla
versions too (see [Backend versions](#backend-versions)).

Built with React 19, TypeScript, Vite, TanStack Router/Query/Form, Tailwind CSS v4 and daisyUI 5.

## Getting started

You need [bun](https://bun.sh) and a running Porla instance to talk to.

```sh
bun install
PORLA_HOST=http://localhost:1337 bun dev
```

Open http://localhost:5173. The dev server proxies `/api` (JSON-RPC) and `/x` (plugin files) to `PORLA_HOST`, which
defaults to `http://localhost:1337`, so you log in with a user on that Porla instance.

### VS Code

Open the folder and install the recommended extensions when asked (ESLint, Prettier, Tailwind CSS IntelliSense,
EditorConfig). The workspace settings format on save, fix lint issues on save, use the project's TypeScript version and
mark the generated `src/routeTree.gen.ts` read-only.

## Scripts

| Command                | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `bun dev`              | Dev server with hot reload                                     |
| `bun run build`        | Type-check and build to `dist/`                                |
| `bun run preview`      | Serve the built `dist/`                                        |
| `bun run typecheck`    | Type-check only                                                |
| `bun run lint`         | ESLint, no warnings allowed                                    |
| `bun run format`       | Format everything with Prettier                                |
| `bun run format:check` | Check formatting (CI runs this, `lint` and `build` on each PR) |

## How it fits together

- **Routing**: file-based routes in `src/routes/`, read by the TanStack Router Vite plugin, which writes
  `src/routeTree.gen.ts` (generated, don't edit; it is committed). Routes are code-split automatically.
- **Data**: `useRPC(method, params)` (a TanStack Query query) and `useInvoker(method)` (a mutation) in `src/api.ts`. Every
  RPC method's params and result are typed in the `Methods` map there.
- **Errors**: a failed query or mutation shows a toast unless the code handles the error itself.
- **Styling**: Tailwind utilities and daisyUI components; the theme follows the system's light or dark mode.
- **Plugins**: plugins can add their own UI in sandboxed iframes; the host is in `src/plugins/` and
  `src/components/plugin-host.tsx`.

### Base path

Porla can serve the UI under a sub-path (`--http-base-path`). `index.html` carries a `%BASE_PATH%` placeholder that
Porla replaces when it serves the page; use `prefixPath()` from `src/base.ts` for any URL you build by hand. Asset URLs
in the build are relative, so they work under any base path.

### Backend versions

New UI features that need a newer Porla are gated with `feature("name")` from `src/features.ts`, keyed by the version
Porla reports. A Porla built without version info (a local debug build) reports `0.0.0` and gets every feature.
