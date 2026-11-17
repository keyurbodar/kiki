# features/captains

Owner: D4. Scope: captain overview, chat identity, avatars.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `chat-identity`: a captain's avatar (library image, or its initial), used in thread rows and the sidebar.
- `captain-overview`: the captain's issue sections ("Needs you", "In progress") in the thread overview pane (Capy's `shared/issues/captain-overview`). It's presentational: the thread overview pane passes issues in.
