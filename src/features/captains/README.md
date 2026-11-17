# features/captains

Owner: D4. Scope: captain overview, chat identity, avatars.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Units:

- `chat-identity`: `ChatIdentity`, the head of a Captain's chat (avatar, inline rename, description, View Captain and Share).
- `overview`: the Captain sections of the overview pane (`CaptainCrewSection`, `CrewThreadRow`, `CrewAction`, `CaptainDriveSection`, `CaptainOverviewEmpty`), `CaptainAvatar`, and the captain atoms and decoders in `captain-data.ts`.
- `drive-file`: `CaptainDriveFileView`, the `captain` view `DriveFilePane` takes (file, folder, pinned version and the empty states of a Captain's drive).

The issue blocks of a Captain's overview ("Needs you", "In progress") and the overview section shell live in `src/components/captain-overview`.
