# features/captains

Owner: D4. Scope: captain overview, chat identity, avatars.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Stub units with their final data-slot names: `chat-identity`.

`dialogs` (H03): the Captain dialog (create, promote, edit, demote, delete), the avatar popover and editor (Capy presets, emoji, private and shared images, background palette), `CaptainAvatar`, the crew device select and the demoted dialog. The dev-only `/__captain-dialog?mode=dark|light` route renders the create dialog.
