# features/settings

Owner: C1. Scope: settings shell, settings nav registry, General, Profile, Security, Shortcuts, Experiments, Referrals.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `nav/`: the settings catalog. `registry.ts` collects `entries/*.ts` (one per page, see [entries/README.md](nav/entries/README.md)); `search.ts` is Capy's settings search over page titles, keywords and rows.
- `shell/`: `SettingsLayout` (the `/settings` layout route: top bar with back crumb, scrolling content, hash scroll, mobile sheet), `SettingsSidebarPanel` (the sidebar wired to the registry, search and router; B1's app shell should host it in its sidebar container on `/settings/*`), `settingsCrumb` and `SettingsIcon`.

Pages compose `SettingsPage` and `SettingsSection` from `@/components/settings-page` and `SettingsRow` / `SettingsRowLink` from `@/primitives/settings-row`, with Capy's props.
