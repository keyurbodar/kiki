import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export type OnboardingStep = {
  step: string;
  completed: boolean;
  skipped: boolean;
};

export type OnboardingStatus = {
  dismissed: boolean;
  steps: ReadonlyArray<OnboardingStep>;
};

const onboardingKey = (orgId: string) => `onboarding:${orgId}`;

export const onboardingStatusAtom = Atom.family((orgId: string) =>
  ApiClient.query("onboarding", "status", {
    params: { orgId },
    reactivityKeys: [onboardingKey(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

const noOnboardingStatusAtom = Atom.make(AsyncResult.initial<unknown, never>());

const restoreOnboardingAtom = ApiClient.mutation("onboarding", "restore");
const unskipOnboardingAtom = ApiClient.mutation("onboarding", "unskip");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function toOnboardingStatus(
  value: unknown,
): OnboardingStatus | undefined {
  if (!isRecord(value) || !Array.isArray(value.steps)) return undefined;
  return {
    dismissed: value.dismissed === true,
    steps: value.steps.flatMap((step: unknown) => {
      if (!isRecord(step)) return [];
      const name = step.step ?? step.id;
      return typeof name === "string"
        ? [
            {
              step: name,
              completed: step.completed === true,
              skipped: step.skipped === true,
            },
          ]
        : [];
    }),
  };
}

export function setupRestoreState(status: OnboardingStatus | undefined) {
  const steps = status?.steps ?? [];
  const allDone = steps
    .filter((step) => step.completed || !step.skipped)
    .every((step) => step.completed);
  const skipped = steps.filter((step) => step.skipped && !step.completed);
  return {
    restorable:
      status !== undefined &&
      (status.dismissed || allDone) &&
      (!allDone || skipped.length > 0),
    skipped,
  };
}

export function useSetupRestore(orgId: string | undefined) {
  const status = toOnboardingStatus(
    Option.getOrUndefined(
      AsyncResult.value(
        useAtomValue(
          orgId === undefined
            ? noOnboardingStatusAtom
            : onboardingStatusAtom(orgId),
        ),
      ),
    ),
  );
  const restoreDismissal = useAtomSet(restoreOnboardingAtom, {
    mode: "promise",
  });
  const unskip = useAtomSet(unskipOnboardingAtom, { mode: "promise" });
  const { restorable, skipped } = setupRestoreState(status);
  return {
    restorable,
    restore: () => {
      if (orgId === undefined) return;
      const reactivityKeys = [onboardingKey(orgId)];
      if (status?.dismissed === true) {
        restoreDismissal({ params: { orgId }, reactivityKeys }).catch(
          () => undefined,
        );
      }
      for (const step of skipped) {
        unskip({ params: { orgId, step: step.step }, reactivityKeys }).catch(
          () => undefined,
        );
      }
    },
  };
}
