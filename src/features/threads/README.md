# features/threads

Owner: D4. Scope: `/threads` list and view toolbar.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `threads-page`: the page (top bar, view tabs, saved views, filter and display menus, filter chips) plus `model.ts`, which holds the filters, the built-in views, the shelves and sections, the thread codes and ages, and the chip models. Page state persists in localStorage under Capy's key `capy-web:threads-page-v4`.
- `threads-list`: sectioned rows with collapsible headers, the loading skeleton and the empty line.

Data comes from `allThreadsAtom` (every page of the jams list, archived or active, with or without filed threads), `captainsAtom` (captains list) and `projectsAtom`. The shared toolbar pieces live in `src/components/view-toolbar` and `src/components/filter-search`.
