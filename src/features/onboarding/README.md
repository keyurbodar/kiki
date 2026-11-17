# features/onboarding

Owner: D7. Scope: welcome, onboarding steps, invites, account link pages, email page.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Units

- `onboarding/`: the `/onboarding` flow (D7c). `OnboardingPage` reads the session, sends onboarded users to `/new` and signed-out users to `/sign-in`, and otherwise walks workspace → profile → subscription → GitHub → recommended (→ plan). `flow.ts` holds the step order, the stepper lists and the `fixture` aliases; `shell.tsx` the panel, stepper, header, footer and rows; `workspace-step.tsx` and `steps.tsx` the steps. `?fixture=<step>` (with `path=team`, `githubFixture=connected`, `covered`) opens a step directly, as Capy's dev fixtures do. The step illustrations in `art/` are Capy's own.
