import { Schema } from "effect";

export const emailPrograms = {
  product_news: {
    label: "Product news",
    description: "Launches and what's new in Capy",
    question: "Stop getting product news?",
    stop: "Stop product news",
    cadence: "when Capy ships something new",
    rowId: "email-product-news",
  },
  weekly: {
    label: "Weekly recap",
    description: "Your week in Capy",
    question: "Stop getting the weekly recap?",
    stop: "Stop weekly recap",
    cadence: "once a week",
    rowId: "email-weekly",
  },
  onboarding: {
    label: "Onboarding tips",
    description: "Getting started in your first weeks",
    question: "Stop getting onboarding tips?",
    stop: "Stop onboarding tips",
    cadence: "in your first weeks",
    rowId: "email-onboarding",
  },
  win_back: {
    label: "Check-ins",
    description: "A note after time away",
    question: "Stop getting check-ins?",
    stop: "Stop check-ins",
    cadence: "after time away",
    rowId: "email-win-back",
  },
} as const;

export type EmailProgram = keyof typeof emailPrograms;

export const isEmailProgram = (value: string): value is EmailProgram =>
  Object.hasOwn(emailPrograms, value);

const ProgramPreferences = Schema.Struct({
  programs: Schema.Array(
    Schema.Struct({ program: Schema.String, subscribed: Schema.Boolean }),
  ),
});

export const programSubscription = (
  preferences: unknown,
  program: EmailProgram,
): boolean | undefined => {
  const decoded = Schema.decodeUnknownOption(ProgramPreferences)(preferences);
  if (decoded._tag === "None") return undefined;
  return decoded.value.programs.find((row) => row.program === program)
    ?.subscribed;
};
