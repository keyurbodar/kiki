# features/shell

Owner: B1. Scope: `/_app` layout, sidebar container, top bar, right panel host, not-found, crash surface.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Units

- `app-layout/`: `AppLayout`, the `/_app` host. Chrome ground (`sidebar-wrapper`), the sidebar (`AppSidebar`, or `SettingsSidebar` under `/settings`), and the inset panel (`Card variant="panel"`, `data-slot="sidebar-panel"`) holding an optional banner and the scrolling `<main>`. Below the md breakpoint the sidebar moves into a sheet labelled "Navigation" and closes on navigation. Pages render their own `AppTopBar` inside `<main>`, as in Capy.
- `sidebar-container/`: Capy's `ui/sidebar` behaviour, re-exported from `@/primitives/sidebar` (P28). `SidebarProvider` (width 240, clamped 224 to 330, persisted in `capy:web:sidebar-width` and `capy:web:sidebar-open`), `useSidebarState`, `useSidebarOpenMobile`, `useSidebarActions`, `StaticSidebarProvider`, `Sidebar` (gap, fixed container, content fade) and the resize rail: drag between the bounds, drag under 112 to collapse, arrow keys step 8 (shift 32), double-click resets. `useSidebarShortcut` binds mod+B.
- `right-panel-host/`: Capy's `ui/right-panel` behaviour for list pages, re-exported from `@/primitives/right-panel` (P28). `RightPanelHost` (the `@container` group, `--right-panel-width` persisted in `capy:web:right-panel-width`, default 520, min 320) and `RightPanelHostPanel` (open, closed and fullscreen states plus a resize rail that closes under 160 and goes fullscreen past the available width plus 64).
- `color-mode/`: keeps the `dark` class in step with the system scheme while the stored mode is `system`.

Pane splits and the tile divider live in `src/components/split`.
