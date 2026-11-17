export type EmailPreferencesState = {
  marketing: boolean;
  programs: ReadonlyArray<{ program: string; subscribed: boolean }>;
  notices: ReadonlyArray<{ template: string; subscribed: boolean }>;
  blocked: boolean;
  noticesEditable: boolean;
};

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

function entries<K extends string>(
  value: unknown,
  key: K,
): Array<Record<K, string> & { subscribed: boolean }> {
  if (Array.isArray(value))
    return value.flatMap((item) => {
      const row = record(item);
      const id = row[key];
      return typeof id === "string" && typeof row.subscribed === "boolean"
        ? [
            { [key]: id, subscribed: row.subscribed } as Record<K, string> & {
              subscribed: boolean;
            },
          ]
        : [];
    });
  return Object.entries(record(value)).flatMap(([id, subscribed]) =>
    typeof subscribed === "boolean"
      ? [
          { [key]: id, subscribed } as Record<K, string> & {
            subscribed: boolean;
          },
        ]
      : [],
  );
}

export function readEmailPreferences(raw: unknown): EmailPreferencesState {
  const state = record(raw);
  return {
    marketing: state.marketing !== false,
    programs: entries(state.programs, "program"),
    notices: entries(state.notices, "template"),
    blocked: state.blocked === true,
    noticesEditable: state.noticesEditable !== false,
  };
}

export const programSubscribed = (
  state: EmailPreferencesState,
  program: string,
  fallback: boolean,
) =>
  state.programs.find((row) => row.program === program)?.subscribed ?? fallback;

export const noticeSubscribed = (
  state: EmailPreferencesState,
  notice: string,
) => state.notices.find((row) => row.template === notice)?.subscribed ?? true;
