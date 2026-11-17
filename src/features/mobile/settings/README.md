# features/mobile/settings (D8e)

Settings on phones. Capy has no separate mobile settings pages: below md the settings route keeps the same `SettingsPage` layout and swaps the sidebar for the left "Navigation" sheet. This unit is that sheet.

- `MobileSettingsSheet`: the settings sidebar (`SettingsSidebarPanel`) inside the Sheet primitive, labelled "Navigation". Mounted only below md, closes when the viewport widens, on navigation and from its trigger. The route passes it to `SettingsLayout` as `MobileSheet`. Styling comes from the Sheet primitive (Capy's `ui/sheet`), so the unit passes no classes.
- `MobileSidebarTrigger`: Capy's `SidebarTrigger` on phones ("Open sidebar" / "Close sidebar", `aria-pressed` follows the sheet).

The page layout (frame `oB3pY-Qv66`) is `SettingsPage` from `@/components/settings-page`, and the appearance page (`ZzrbqHbXUI`) is C2's responsive appearance page; neither has mobile-only code in Capy.
