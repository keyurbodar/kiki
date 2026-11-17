# kiki

kiki design engineering.

## Web stack

The web app mirrors Capy's web stack, managed with [bun](https://bun.sh).

- **Build:** Vite 8 (Rolldown), `@vitejs/plugin-react`, React Compiler via `@rolldown/plugin-babel`, TypeScript checked with `tsgo`
- **Core:** React 19.2, Effect 4 with `@effect/atom-react` for state, Immer
- **Routing:** TanStack Router with file-based routes in `src/routes`
- **UI:** Tailwind CSS 4, Base UI, class-variance-authority, Sonner, Legend List, dnd-kit
- **Composer:** Lexical
- **Rich content:** Shiki, KaTeX, Mermaid, unified/remark/rehype
- **Files and viewers:** `@pierre/diffs`, `@pierre/trees`, docx-preview, SheetJS (from the SheetJS CDN), fflate, Recharts, shell-quote
- **Tooling:** Vitest with `@effect/vitest`, Testing Library, Playwright, Biome

## Layout

Start with [CONTRIBUTING.md](CONTRIBUTING.md): it explains how a package plugs in without conflicts.

```
src/
  tokens/        token layer (KIKI-10); contract.css holds the names until it lands
  primitives/    Capy ui/* primitives, one directory each (Base UI + cva)
  components/    Capy shared/* composites, one directory each
  features/      screen groups, one directory per unit inside each
  routes/        TanStack file routes, all 159 app routes
  data/          data layer (A3, KIKI-13) and event schemas (A8, KIKI-14)
  lib/           small shared helpers
```

The data layer modules, owned by their packages:

- `src/data/api/`: the Effect HttpApi definition, one file per group under `src/data/api/groups/`
- `src/data/client/`: the typed client and the AtomHttpApi service
- `src/data/mocks/<group>/`: one mock directory per API group
- `src/data/atoms/`: effect-atom conventions
- `src/data/realtime/`: SSE `events/stream` and WebSocket services with a fake emitter
- `src/data/events/`: thread event schemas, timeline row schemas and the fixture generator (A8)

`@/` resolves to `src/` in Vite, Vitest and TypeScript.

## Commands

```sh
bun install          # install dependencies
bun run dev          # start the dev server
bun run build        # production build into dist/
bun run preview      # serve the production build
bun run typecheck    # type-check with tsgo
bun run lint         # Biome lint and format check
bun run format       # apply Biome formatting
bun run test         # run Vitest once
```
