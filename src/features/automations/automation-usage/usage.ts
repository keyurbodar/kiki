/** The usage summary `/automation/:id` shows: spend, runs and the daily series. */
export type UsagePoint = {
  readonly start: string;
  readonly runs: number;
  readonly credits: number;
};

export type AutomationUsage = {
  readonly runs: number;
  readonly credits: number;
  readonly points: ReadonlyArray<UsagePoint>;
};

const empty: AutomationUsage = { runs: 0, credits: 0, points: [] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const point = (value: unknown): UsagePoint | undefined => {
  if (!isRecord(value)) return undefined;
  const start = value.start ?? value.day ?? value.date;
  return typeof start === "string"
    ? {
        start,
        runs: num(value.runs ?? value.count),
        credits: num(value.credits ?? value.spend ?? value.cost),
      }
    : undefined;
};

/** Capy serves the daily series under `series`, older payloads as `days`. */
const pointsOf = (value: Record<string, unknown>) => {
  const list = value.series ?? value.days ?? value.daily;
  const points = Array.isArray(list)
    ? list.flatMap((entry) => point(entry) ?? [])
    : [];
  return [...points].sort((a, b) => a.start.localeCompare(b.start));
};

export const decodeAutomationUsage = (value: unknown): AutomationUsage => {
  if (!isRecord(value)) return empty;
  const points = pointsOf(value);
  return {
    runs: num(value.totalRuns ?? value.runs ?? value.count),
    credits: num(value.credits ?? value.spend ?? value.cost),
    points,
  };
};

/** Dollars, as Capy prints them: `$0` and `$1.20`, never `$0.00`. */
export const formatSpend = (credits: number) =>
  `$${credits.toFixed(credits > 0 && credits < 100 ? 2 : 0)}`;

export const usageCaption = (runs: number) =>
  `${runs} run${runs === 1 ? "" : "s"} in the last 30 days`;

/** A chart date, as the axis and tooltip print it. */
export const formatDay = (start: string) => {
  const date = new Date(start);
  return Number.isNaN(date.valueOf())
    ? start
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
