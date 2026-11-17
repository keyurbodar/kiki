# features/drive/drive-page

Owner: D6 (pack DR01). Capy Drive's root (`/drive`) and Shared page (`/drive/shared`).

- `drive-page.tsx`: the scope directory with the Display (ordering) menu, search, paging and the storage meter (`usage-footer.tsx`).
- `shared-page.tsx`: every share link in the organization, with copy, open, visibility and remove actions.
- `directory-table.tsx`: Capy's grid directory table (div subgrid rows) that both pages use.
- `drive-top-bar.tsx`: the top bar these pages render until `components/app-top-bar` takes a title, search and trailing actions.
- `names.ts`, `session.ts`: the org, user, project, Captain and automation names the scope rows are labelled with.

Scope labels, ordering and routes come from `../lib`; data comes from `@/data/atoms/drive`.
