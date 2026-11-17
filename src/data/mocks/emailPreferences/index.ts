import { Effect, Ref } from "effect";
import { fields } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleEmailPreferences } from "./fixtures.ts";

interface Preferences {
  marketing: boolean;
  notices: Record<string, boolean>;
  programs: Record<string, boolean>;
  updatedAt: string;
}

const readEnabled = (input: Record<string, unknown>, fallback: boolean) =>
  typeof input.enabled === "boolean"
    ? input.enabled
    : typeof input.subscribed === "boolean"
      ? input.subscribed
      : fallback;

export const EmailPreferencesMock = mockGroup("emailPreferences", (handlers) =>
  Effect.gen(function* () {
    const preferences = yield* Ref.make<Preferences>({
      ...sampleEmailPreferences,
      notices: { ...sampleEmailPreferences.notices },
      programs: { ...sampleEmailPreferences.programs },
      updatedAt: sampleEmailPreferences.updatedAt,
    });

    const save = (next: Preferences) =>
      Ref.set(preferences, { ...next, updatedAt: isoMinutesAgo(0) }).pipe(
        Effect.as(next),
      );

    return handlers
      .handle("get", () => Ref.get(preferences))
      .handle("setMarketing", ({ payload }) =>
        Effect.flatMap(Ref.get(preferences), (current) =>
          save({
            ...current,
            marketing: readEnabled(fields(payload), current.marketing),
          }),
        ),
      )
      .handle("setNotice", ({ params, payload }) =>
        Effect.flatMap(Ref.get(preferences), (current) =>
          save({
            ...current,
            notices: {
              ...current.notices,
              [params.template]: readEnabled(
                fields(payload),
                current.notices[params.template] ?? true,
              ),
            },
          }),
        ),
      )
      .handle("setProgram", ({ params, payload }) =>
        Effect.flatMap(Ref.get(preferences), (current) =>
          save({
            ...current,
            programs: {
              ...current.programs,
              [params.program]: readEnabled(
                fields(payload),
                current.programs[params.program] ?? false,
              ),
            },
          }),
        ),
      );
  }),
);
