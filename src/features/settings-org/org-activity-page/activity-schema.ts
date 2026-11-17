type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const int = (value: unknown) => (typeof value === "number" ? value : 0);
const intOrNull = (value: unknown) =>
  typeof value === "number" ? value : null;
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];
const date = (value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number")
    return new Date(0);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};
const dateOrNull = (value: unknown) =>
  value === null || value === undefined ? null : date(value);

export const loopTriggers = [
  "ci_failed",
  "pr_feedback_human",
  "pr_feedback_bot",
  "review_finding",
] as const;
export type ActivityLoopTrigger = (typeof loopTriggers)[number];

export type ActivityCount = { current: number; previous: number };
export type ActivityDay = {
  date: Date;
  merged: number;
  mergedAll: number;
  without: number;
};
export type ActivityTouchRepo = { repoFullName: string; touches: number };
export type ActivityTouchDay = {
  date: Date;
  total: number;
  repos: ReadonlyArray<ActivityTouchRepo>;
  moreRepos: number;
  moreTouches: number;
  noRepo: number;
};
export type ActivityHoursDay = { date: Date; agentMs: number };
export type ActivityLoopDay = {
  date: Date;
  trigger: ActivityLoopTrigger;
  loops: number;
};
export type ActivityMemberSplit = {
  members: ReadonlyArray<{ userId: string; total: number }>;
  others: number;
  days: ReadonlyArray<{
    date: Date;
    members: ReadonlyArray<number>;
    others: number;
  }>;
};
export type ActivityServiceUsers = {
  count: number;
  merged: number;
  loops: number | null;
  agentMs: number | null;
};
export type ActivityProjectOption = {
  id: string;
  name: string;
  repos: ReadonlyArray<string>;
};

export type OrgActivity = {
  from: Date;
  to: Date;
  repoCount: number;
  projectOptions: ReadonlyArray<ActivityProjectOption>;
  membersWithoutLogin: ReadonlyArray<string>;
  connectedAt: Date | null;
  merged: ActivityCount;
  mergedAll: ActivityCount;
  threadMerged: number;
  reviewOnlyMerged: number;
  contributed: ActivityCount;
  findings: ActivityCount;
  loops: ActivityCount | null;
  loopDays: ReadonlyArray<ActivityLoopDay> | null;
  agentMs: ActivityCount | null;
  hoursDays: ReadonlyArray<ActivityHoursDay> | null;
  days: ReadonlyArray<ActivityDay>;
  touches: ReadonlyArray<ActivityTouchDay>;
  mergedByMember: ActivityMemberSplit;
  loopsByMember: ActivityMemberSplit | null;
  hoursByMember: ActivityMemberSplit | null;
  serviceUsers: ActivityServiceUsers;
};

export type HourlyCell = {
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hour: number;
  agentMs: number;
  turnCount: number;
  occurrences: number;
  meanAgentMs: number;
};

export type FleetHourlyActivity = {
  from: Date;
  to: Date;
  timezone: string;
  completeDays: number;
  cells: ReadonlyArray<HourlyCell>;
  hours: ReadonlyArray<{
    from: Date;
    to: Date;
    agentMs: number;
    turnCount: number;
  }> | null;
};

const count = (value: unknown): ActivityCount => {
  const r = row(value);
  return { current: int(r.current), previous: int(r.previous) };
};

const countOrNull = (value: unknown) =>
  value === null || value === undefined ? null : count(value);

const memberSplit = (value: unknown): ActivityMemberSplit => {
  const r = row(value);
  return {
    members: list(r.members).map((entry) => {
      const m = row(entry);
      return { userId: str(m.userId), total: int(m.total) };
    }),
    others: int(r.others),
    days: list(r.days).map((entry) => {
      const d = row(entry);
      return {
        date: date(d.date),
        members: list(d.members).map(int),
        others: int(d.others),
      };
    }),
  };
};

const memberSplitOrNull = (value: unknown) =>
  value === null || value === undefined ? null : memberSplit(value);

const isLoopTrigger = (value: unknown): value is ActivityLoopTrigger =>
  typeof value === "string" &&
  (loopTriggers as ReadonlyArray<string>).includes(value);

/**
 * Capy's org activity payload, read loosely: the endpoint is not decoded yet, so
 * anything unrecognised becomes a zero rather than throwing.
 */
export const decodeOrgActivity = (value: unknown): OrgActivity => {
  const r = row(value);
  return {
    from: date(r.from),
    to: date(r.to),
    repoCount: int(r.repoCount),
    projectOptions: list(r.projectOptions).map((entry) => {
      const p = row(entry);
      return {
        id: str(p.id),
        name: str(p.name),
        repos: list(p.repos).map((repo) => str(repo)),
      };
    }),
    membersWithoutLogin: list(r.membersWithoutLogin).map((login) => str(login)),
    connectedAt: dateOrNull(r.connectedAt),
    merged: count(r.merged),
    mergedAll: count(r.mergedAll),
    threadMerged: int(r.threadMerged),
    reviewOnlyMerged: int(r.reviewOnlyMerged),
    contributed: count(r.contributed),
    findings: count(r.findings),
    loops: countOrNull(r.loops),
    loopDays:
      r.loopDays === null || r.loopDays === undefined
        ? null
        : list(r.loopDays).flatMap((entry) => {
            const d = row(entry);
            return isLoopTrigger(d.trigger)
              ? [
                  {
                    date: date(d.date),
                    trigger: d.trigger,
                    loops: int(d.loops),
                  },
                ]
              : [];
          }),
    agentMs: countOrNull(r.agentMs),
    hoursDays:
      r.hoursDays === null || r.hoursDays === undefined
        ? null
        : list(r.hoursDays).map((entry) => {
            const d = row(entry);
            return { date: date(d.date), agentMs: int(d.agentMs) };
          }),
    days: list(r.days).map((entry) => {
      const d = row(entry);
      return {
        date: date(d.date),
        merged: int(d.merged),
        mergedAll: int(d.mergedAll),
        without: int(d.without),
      };
    }),
    touches: list(r.touches).map((entry) => {
      const d = row(entry);
      return {
        date: date(d.date),
        total: int(d.total),
        repos: list(d.repos).map((repo) => {
          const t = row(repo);
          return { repoFullName: str(t.repoFullName), touches: int(t.touches) };
        }),
        moreRepos: int(d.moreRepos),
        moreTouches: int(d.moreTouches),
        noRepo: int(d.noRepo),
      };
    }),
    mergedByMember: memberSplit(r.mergedByMember),
    loopsByMember: memberSplitOrNull(r.loopsByMember),
    hoursByMember: memberSplitOrNull(r.hoursByMember),
    serviceUsers: {
      count: int(row(r.serviceUsers).count),
      merged: int(row(r.serviceUsers).merged),
      loops: intOrNull(row(r.serviceUsers).loops),
      agentMs: intOrNull(row(r.serviceUsers).agentMs),
    },
  };
};

export const decodeHourlyActivity = (
  value: unknown,
): FleetHourlyActivity | null => {
  if (value === null || value === undefined) return null;
  const r = row(value);
  const weekday = (entry: unknown): HourlyCell["weekday"] => {
    const day = int(entry);
    return (day >= 1 && day <= 7 ? day : 1) as HourlyCell["weekday"];
  };
  return {
    from: date(r.from),
    to: date(r.to),
    timezone: str(r.timezone, "UTC"),
    completeDays: int(r.completeDays),
    cells: list(r.cells).map((entry) => {
      const c = row(entry);
      return {
        weekday: weekday(c.weekday),
        hour: int(c.hour),
        agentMs: int(c.agentMs),
        turnCount: int(c.turnCount),
        occurrences: int(c.occurrences),
        meanAgentMs: typeof c.meanAgentMs === "number" ? c.meanAgentMs : 0,
      };
    }),
    hours:
      r.hours === null || r.hours === undefined
        ? null
        : list(r.hours).map((entry) => {
            const h = row(entry);
            return {
              from: date(h.from),
              to: date(h.to),
              agentMs: int(h.agentMs),
              turnCount: int(h.turnCount),
            };
          }),
  };
};

/** True when the payload carries none of the keys Capy's activity payload has. */
export const isActivityPayload = (value: unknown) => {
  const r = row(value);
  return "days" in r || "mergedAll" in r || "mergedByMember" in r;
};
