export const subscribeOnMessageModes = ["ask", "always", "never"] as const;

export type SubscribeOnMessageMode = (typeof subscribeOnMessageModes)[number];

export const subscribeOnMessageLabels: Record<SubscribeOnMessageMode, string> =
  {
    ask: "Ask",
    always: "Always subscribe",
    never: "Never",
  };

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const flags = (value: unknown): Record<string, boolean> | undefined => {
  const source = record(value);
  if (source === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(source).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
    ),
  );
};

export function subscribeOnMessageMode(
  preferences: Readonly<Record<string, unknown>> | undefined,
): SubscribeOnMessageMode {
  const value = preferences?.subscribeOnMessage;
  return value === "always" || value === "never" ? value : "ask";
}

export type SlackNotificationPreferences = {
  enabled: boolean;
  kinds: Readonly<Record<string, boolean>> | undefined;
  origins: Readonly<Record<string, boolean>> | undefined;
};

export function slackNotificationPreferences(
  preferences: Readonly<Record<string, unknown>> | undefined,
): SlackNotificationPreferences | undefined {
  const slack = record(record(preferences?.notifications)?.slack);
  if (slack === undefined) return undefined;
  return {
    enabled: slack.enabled === true,
    kinds: flags(slack.kinds),
    origins: flags(slack.origins),
  };
}
