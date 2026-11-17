# features/mobile

Owner: D8. Scope: mobile view, drawers, edge swipe, mobile list variants.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Units (D8a)

- `use-mobile/`: `useIsNarrow` (below `--breakpoint-md`, Capy's `(max-width: 767px)`) and `useIsTouch` (`(hover: none) and (pointer: coarse)`).
- `shell/`: `MobileSidebarTrigger` and `MobileTopBar`. The narrow wrapper chain (`sidebar-wrapper` > `sidebar-panel` > `main`) and the left `Navigation` sheet come from B1's `AppLayout`, exactly as in Capy's narrow DOM; the trigger drives B1's `openMobile` state, so there is one sheet.
- `home/`: `MobileHome` (the /new layout on phones) and `MobileNewThread` (wired to the projects atom).
- `composer/`: `MobileComposer`, the phone thread's composer. It is the shared `src/components/composer` Composer with the phone's `/` commands, `@` mention sources and add/model triggers passed in, not a second composer; `composer-catalog.tsx` holds those two catalogs.
- `sheets/`: bottom drawers for project, add to message and model.
- `edge-swipe/`: parity note and test; Capy has no edge-swipe handler.
