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
