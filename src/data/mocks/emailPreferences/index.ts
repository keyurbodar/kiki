import { Effect, Ref } from "effect";
import {
  EmailNoticePreference,
  EmailPreferencesState,
  EmailProgramPreference,
} from "../../api/schemas/emailPreferences.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleEmailPreferences } from "./fixtures.ts";

export const EmailPreferencesMock = mockGroup("emailPreferences", (handlers) =>
  Effect.gen(function* () {
    const preferences = yield* Ref.make(sampleEmailPreferences);

    const update = (
      change: (
        current: EmailPreferencesState,
      ) => Partial<EmailPreferencesState>,
    ) =>
      Ref.updateAndGet(
        preferences,
        (current) =>
          new EmailPreferencesState({ ...current, ...change(current) }),
      );

    return handlers
      .handle("get", () => Ref.get(preferences))
      .handle("setMarketing", ({ payload }) =>
        update(() => ({ marketing: payload.subscribed })),
      )
      .handle("setNotice", ({ params, payload }) =>
        update((current) => {
          const notice = new EmailNoticePreference({
            template: params.template,
            subscribed: payload.subscribed,
          });
          return {
            notices: current.notices.some(
              (row) => row.template === params.template,
            )
              ? current.notices.map((row) =>
                  row.template === params.template ? notice : row,
                )
              : [...current.notices, notice],
          };
        }),
      )
      .handle("setProgram", ({ params, payload }) =>
        update((current) => ({
          programs: current.programs.map((row) =>
            row.program === params.program
              ? new EmailProgramPreference({
                  program: row.program,
                  subscribed: payload.subscribed,
                })
              : row,
          ),
        })),
      );
  }),
);
