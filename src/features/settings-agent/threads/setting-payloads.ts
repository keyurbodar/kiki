import type {
  AgentPreferences,
  FeedbackSettings,
  GitPreferences,
  TaskLimitKey,
} from "./agent-settings";

/** Capy's mock applies updates shallowly per top-level key, so send the whole nested group. */
export const patchGitPreferences = (
  preferences: AgentPreferences,
  patch: { [K in keyof GitPreferences]?: GitPreferences[K] | null },
): Record<string, unknown> => ({
  ...(preferences.git ?? {}),
  ...Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== null),
  ),
});

/** Same for the personal GitHub overrides and the personal task limits. */
export const patchGithubPreferences = (
  preferences: AgentPreferences,
  key: keyof FeedbackSettings,
  value: unknown,
): Record<string, unknown> => ({
  ...(preferences.github ?? {}),
  [key]: value ?? null,
});

export const patchTaskLimits = (
  preferences: AgentPreferences,
  key: TaskLimitKey,
  value: number | undefined,
): Record<string, unknown> => ({
  ...(preferences.tasks ?? {}),
  [key]: value ?? null,
});

export const patchSigningPreferences = (
  preferences: AgentPreferences,
  signCommits: boolean,
): Record<string, unknown> => ({
  ...(preferences.gitSigning ?? {}),
  signCommits,
});

/** Capy's task-limit endpoint names the depth field `nested`; send both limits so the untouched one is preserved. */
export const taskLimitsPayload = (
  key: TaskLimitKey,
  value: number | undefined,
  current: { concurrent?: number; nestedDepth?: number },
  defaults: { concurrent: number; nestedDepth: number },
) => ({
  concurrent:
    key === "concurrent"
      ? (value ?? defaults.concurrent)
      : (current.concurrent ?? defaults.concurrent),
  nested:
    key === "nestedDepth"
      ? (value ?? defaults.nestedDepth)
      : (current.nestedDepth ?? defaults.nestedDepth),
});
