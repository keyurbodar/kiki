export const intents = [
  "neutral",
  "accent",
  "danger",
  "warning",
  "success",
  "info",
  "purple",
  "pink",
  "orange",
  "lime",
] as const;

export type Intent = (typeof intents)[number];

export const intentVariants = Object.fromEntries(
  intents.map((intent) => [intent, ""]),
) as Record<Intent, string>;
