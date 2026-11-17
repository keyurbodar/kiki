# features/thread-panes

Owner: B9, B10, B11. Scope: thread panes: tab strip, tiles, overview, files, diffs, browser, previews, desktop.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Stub units with their final data-slot names: `tab-strip`, `tile-surface`, `browser-omnibox`, `desktop-toolbar`, `fabric-viewport`, `background-upload-status`.
