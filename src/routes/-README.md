# routes

TanStack file routes, one file per route, mirroring Capy's router ids one to one (159 app routes; staff `/admin` routes are out of scope).

- `_app/` is the signed-in shell layout, `_auth/` the auth layout. Everything else at the top level (`welcome`, `onboarding`, `web/callbacks/*`, `s/$shareId` and so on) renders without the shell.
- A trailing underscore (`drive_/`, `$projectId_/`) means "not nested under the parent's layout", exactly like Capy's ids.
- `route.tsx` is a layout with children, `index.tsx` an index route.
- Every route file is thin: `createFileRoute` with its params, `validateSearch` (via `@/lib/search-params`) and redirects, plus a component. Screens live in `src/features/`.
- Redirect-only routes (legacy `/project/*`, `/volumes`, `/settings/integrations/mcp` and so on) carry only `beforeLoad`.
- `src/routeTree.gen.ts` is generated; never edit it.
- Files prefixed with `-` (this README, `-routes.test.ts`) are ignored by the router.
- `[__tokens].tsx` is the dev-only token specimen at `/__tokens` (404 in production). It isn't one of Capy's routes, so the route-count test leaves it out.
