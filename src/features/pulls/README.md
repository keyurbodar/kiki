# features/pulls

Owner: PR01 (list) and PR02–PR05 (pull view). Scope: pull requests list and pull view.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `pulls-page/`: the /pulls page (header, view tabs, saved views, filter and display menus, filter chips), its filter/section model, local-storage prefs (`capy-web:pulls-page`) and `data/`, which decodes the still-`Undecoded` pulls, branches and installation-repo endpoints.
- `pulls-list/`: the sectioned list and its row (state icon, code, author, title, thread badge, diff stat, age), plus the pull glyphs the sprite does not carry yet.
- `new-pull-dialog/`: the "New pull request" dialog with its repository and branch pickers.
