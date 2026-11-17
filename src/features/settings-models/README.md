# features/settings-models

Owner: C3. Scope: models and model routing.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

| Unit                    | Package | What it holds                                                                                                                                                                       |
| ----------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model-routing/`        | ST11    | Connection rows (subscriptions, keys, Capy credits), the model tick tree, run-out and member rows, the models table, the `models` atoms and the routing logic the other units share |
| `model-connect-sheet/`  | ST11    | The sheet that connects or edits a key or endpoint, and the remove dialog                                                                                                           |
| `add-connection-sheet/` | ST11    | The picker that starts a new subscription or key connection                                                                                                                         |
