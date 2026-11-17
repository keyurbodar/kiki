# features/mobile

Owner: D8. Scope: mobile view, drawers, edge swipe, mobile list variants.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Units (D8a)

- `use-mobile/`: `useIsNarrow` (below `--breakpoint-md`, Capy's `(max-width: 767px)`) and `useIsTouch` (`(hover: none) and (pointer: coarse)`).
- `shell/`: `MobileNavigationProvider` / `useMobileNavigation`, `MobileShell` (sidebar inside the left `Navigation` sheet on narrow screens), `MobileSidebarTrigger`, `MobileTopBar`.
- `home/`: `MobileHome` (the /new layout on phones) and `MobileNewThread` (wired to the projects atom).
- `sheets/`: bottom drawers for project, add to message and model.
- `edge-swipe/`: parity note; Capy has no edge-swipe handler.
