# features/command-palette

Owner: B3. Scope: command palette (search, categories, prefixes, keyboard model).

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Units

- `palette/`: `CommandPaletteHost`, mounted once by the shell. It opens on Cmd/Ctrl+K and on `openCommandPalette(intent)` from `src/lib/command-palette-events.ts`, and switches between the search (`@/components/command-menu-search`), compose (`@/components/command-menu-compose`) and project (`@/components/command-menu-project`) views. `search-source.ts` is the Search aggregator: a `PaletteSearchSource` of captains, threads, pull requests, automations and projects, fed with neutral sample data until those list endpoints are typed.
