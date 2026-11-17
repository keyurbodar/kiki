# features/sidebar

Owner: B2. Scope: sidebar threads/captains modes, rows, hover cards, menus.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Stub units with their final data-slot names: `sidebar-thread-row`.

## Units

- B2a frame (shared composites, not under this folder): `components/app-sidebar` (header with the mode toggle or Capy mark, Search, New thread, sidebar trigger; content slots for `SidebarThreads`, `SidebarAnnouncements`, `SidebarSetupCard`, `SidebarDealReminder`, `SidebarReferralMenu`; footer with `UserMenu` and the page bar with its More menu and context menu), `components/sidebar-mode-toggle` (`data-slot="sidebar-mode"`, Captains/Threads), `components/sidebar-nav-editor` (page list logic and `SidebarPagesMenuItems`), and `lib/command-palette-events` (`openCommandPalette()`, `useCommandPaletteOpen()`).
