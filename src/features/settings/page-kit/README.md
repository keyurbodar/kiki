# features/settings/page-kit

Owner: C1b. The page structure every C1b settings page composes: `SettingsPageLayout` (Capy's `shared/settings-page` header and width), `SettingsSection`, `SettingsField` (Capy's `SettingsRow` from `ui/card`, rendered through the `settings-row` primitive stub) and the load states. Class strings are copied from the bundle.

When the C1a shell unit fills `SettingsPage` and `SettingsRow` with these props, this folder reduces to re-exports.
