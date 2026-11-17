export type SetupFailure = {
  machineId: string;
  repo?: string;
  phase?: "initialize" | "refresh" | "startup";
  entry?: string;
  detail: string;
  retryAtMs?: number;
  stopped: boolean;
  outcome?: { kind: "recovered" | "failed"; at: Date };
};

export const DETAIL_LINES = 3;

const repoShortName = (repo: string) => repo.slice(repo.indexOf("/") + 1);

const stepName = (setup: SetupFailure) => {
  if (setup.repo === undefined) return undefined;
  if (setup.phase === "startup") return setup.entry ?? "startup";
  if (setup.phase === "initialize") return "initialize";
  if (setup.phase === "refresh") return "refresh";
  return undefined;
};

export const setupStepLabel = (setup: SetupFailure) => {
  if (setup.repo === undefined) return "Workspace setup";
  const repo = repoShortName(setup.repo);
  const step = stepName(setup);
  return step === undefined
    ? `Checkout of ${repo}`
    : `Setup step ${step} for ${repo}`;
};

export const setupFailureTitle = (setup: SetupFailure) =>
  setup.stopped
    ? `${setupStepLabel(setup)} failed again, Capy stopped retrying`
    : `${setupStepLabel(setup)} failed`;

export const setupOutcomeLabel = (setup: SetupFailure) =>
  setup.outcome?.kind === "recovered"
    ? `${setupStepLabel(setup)} passed on retry`
    : `${setupStepLabel(setup)} failed again`;

export const setupFailureDescription = (setup: SetupFailure) => {
  const step = stepName(setup);
  const subject =
    step !== undefined && setup.phase === "startup"
      ? step
      : setup.repo === undefined
        ? "the workspace"
        : repoShortName(setup.repo);
  return setup.stopped
    ? `Capy keeps working, commands that need ${subject} will fail until the step is fixed`
    : `Capy keeps working, commands that need ${subject} may fail until it passes`;
};

export const lastLines = (text: string, count: number) =>
  text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-count)
    .join("\n");

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const DAY_MS = 24 * 60 * 60 * 1000;

export const formatEventTime = (date: Date, now = Date.now()) => {
  const today = new Date(now);
  if (date.toDateString() === today.toDateString())
    return timeFormat.format(date);
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  );
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday ${timeFormat.format(date)}`;
  return now - date.getTime() < 6 * DAY_MS
    ? weekdayFormat.format(date)
    : dateFormat.format(date);
};

export const formatRetryTime = (date: Date, now = Date.now()) => {
  if (date.toDateString() === new Date(now).toDateString())
    return timeFormat.format(date);
  return date.getTime() - now < 6 * DAY_MS
    ? weekdayFormat.format(date)
    : dateFormat.format(date);
};
