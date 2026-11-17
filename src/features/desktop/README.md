# features/desktop

Owner: D9. Scope: desktop and desktop passkey pages (web renders). X01 adds `desktop-reverification-dialog`, the in-app "Confirm it's you" dialog driven by the desktop session bridge.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).
