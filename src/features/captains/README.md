# features/captains

Owner: D4. Scope: captain overview, chat identity, avatars.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `chat-identity`: `ChatIdentity`. The compact thread-row tile (library image, or the name's initial) and the head of a Captain's chat (avatar, inline rename, description, View Captain and Share).
- `dialogs`: the Captain dialog (create, promote, edit, demote, delete) with its description, demote and delete pages, the avatar popover and editor (Capy presets, emoji, private and shared library images, background palette), `CaptainAvatar`, `CrewDeviceSelect` and the demoted dialog. The dev-only `/__captain-dialog?mode=dark|light` route renders the create dialog.
- `captain-overview`: the captain's issue sections ("Needs you", "In progress") in the thread overview pane (Capy's `shared/issues/captain-overview`). It's presentational: the thread overview pane passes issues in.
- `overview`: the Captain's own sections of the overview pane (Capy's `features/captain/overview`): `CaptainCrewSection` with `CrewThreadRow` and `CrewAction`, `CaptainDriveSection`, and `CaptainOverviewEmpty`, plus the captain atoms and decoders in `captain-data.ts`. Preset avatars come from `@/primitives/captain-avatar`.
- `drive-file`: `CaptainDriveFileView`, the `captain` view `DriveFilePane` takes (file, folder, pinned version and the empty states of a Captain's drive).

The overview section shell (`OverviewSection`, `OverviewEmpty`, `OverviewSurfaceRow`, the shared row classes) and Capy's minified relative time live in `src/components/captain-overview`.
