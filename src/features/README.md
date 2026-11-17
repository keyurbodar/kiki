# features

Screen-level code grouped by product area (threads, settings, explore, drive, ...), mirroring Capy's `features/<area>/` layout. A feature owns its state (effect-atom), its API calls (Effect HttpApi client against mocked services) and the components only it uses. Features compose `src/components` and `src/primitives` and never hold raw values: `bun run lint` fails on hex, px or ms outside `src/tokens`.
