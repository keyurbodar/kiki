import { Effect, Ref } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { onboardingSteps, sampleOnboardingState } from "./fixtures.ts";

interface OnboardingState {
  dismissed: boolean;
  completedSteps: ReadonlyArray<string>;
  skippedSteps: ReadonlyArray<string>;
}

export const OnboardingMock = mockGroup("onboarding", (handlers) =>
  Effect.gen(function* () {
    const states = yield* Ref.make<
      ReadonlyArray<{ orgId: string; state: OnboardingState }>
    >([]);

    const forOrg = (orgId: string) =>
      Effect.map(
        Ref.get(states),
        (rows) =>
          rows.find((row) => row.orgId === orgId)?.state ?? {
            ...sampleOnboardingState,
            completedSteps: [...sampleOnboardingState.completedSteps],
            skippedSteps: [...sampleOnboardingState.skippedSteps],
          },
      );

    const write = (orgId: string, state: OnboardingState) =>
      Ref.update(states, (rows) => [
        ...rows.filter((row) => row.orgId !== orgId),
        { orgId, state },
      ]).pipe(Effect.as(state));

    const view = (orgId: string, state: OnboardingState) => ({
      orgId,
      dismissed: state.dismissed,
      steps: onboardingSteps.map((step) => ({
        id: step,
        completed: state.completedSteps.includes(step),
        skipped: state.skippedSteps.includes(step),
      })),
      completedCount: state.completedSteps.length,
      skippedCount: state.skippedSteps.length,
    });

    return handlers
      .handle("status", ({ params }) =>
        Effect.map(forOrg(params.orgId), (state) => view(params.orgId, state)),
      )
      .handle("dismiss", ({ params }) =>
        Effect.flatMap(forOrg(params.orgId), (state) =>
          write(params.orgId, { ...state, dismissed: true }).pipe(
            Effect.map((next) => view(params.orgId, next)),
          ),
        ),
      )
      .handle("restore", ({ params }) =>
        Effect.flatMap(forOrg(params.orgId), (state) =>
          write(params.orgId, { ...state, dismissed: false }).pipe(
            Effect.map((next) => view(params.orgId, next)),
          ),
        ),
      )
      .handle("skip", ({ params }) =>
        Effect.flatMap(forOrg(params.orgId), (state) =>
          write(params.orgId, {
            ...state,
            skippedSteps: state.skippedSteps.includes(params.step)
              ? state.skippedSteps
              : [...state.skippedSteps, params.step],
          }).pipe(Effect.map((next) => view(params.orgId, next))),
        ),
      )
      .handle("unskip", ({ params }) =>
        Effect.flatMap(forOrg(params.orgId), (state) =>
          write(params.orgId, {
            ...state,
            skippedSteps: state.skippedSteps.filter(
              (step) => step !== params.step,
            ),
          }).pipe(Effect.map((next) => view(params.orgId, next))),
        ),
      );
  }),
);
