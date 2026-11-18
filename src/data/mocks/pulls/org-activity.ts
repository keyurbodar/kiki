import { people, repos } from "../fixtures/world.ts";

/** Deterministic pseudo-random source, so a reload shows the same dashboard. */
const seeded = (seed: number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const dayMs = 24 * 60 * 60 * 1000;

const dayIso = (from: Date, index: number) =>
  new Date(from.getTime() + index * dayMs);

const count = (current: number, previous: number) => ({ current, previous });

/**
 * Capy's org activity payload for the mock world: a year of contribution and
 * merged-pull history shaped exactly like the endpoint's, so the page can draw
 * its stats, contribution grid and the three charts.
 */
export const sampleOrgActivity = (
  now: Date,
  memberIds: ReadonlyArray<string> = [
    people.alex.id,
    people.priya.id,
    people.sam.id,
  ],
) => {
  const random = seeded(20261118);
  const from = new Date(now.getTime() - 365 * dayMs);
  const members = memberIds.map((userId, index) => ({
    userId,
    weight: 1 - index * 0.2,
  }));

  const days = Array.from({ length: 365 }, (_, index) => {
    const weekday = dayIso(from, index).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const scale = weekend ? 0.25 : 1;
    const mergedAll = Math.round(random() * 4 * scale);
    const without = Math.round(random() * mergedAll);
    return {
      date: dayIso(from, index).toISOString(),
      merged: mergedAll - without,
      mergedAll,
      without,
    };
  });

  const touches = Array.from({ length: 365 }, (_, index) => {
    const weekday = dayIso(from, index).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const total = Math.round(random() * (weekend ? 2 : 7));
    const repoRows = repos
      .slice(0, 2)
      .map((repo) => ({
        repoFullName: repo.fullName,
        touches: Math.round(total * (repo === repos[0] ? 0.6 : 0.4)),
      }))
      .filter((row) => row.touches > 0);
    return {
      date: dayIso(from, index).toISOString(),
      total,
      repos: repoRows,
      moreRepos: repos.length > 2 ? Math.max(0, repos.length - 2) : 0,
      moreTouches: 0,
      noRepo: 0,
    };
  });

  const mergedTotal = days.reduce((sum, day) => sum + day.mergedAll, 0);
  const mergedWithCapy = days.reduce((sum, day) => sum + day.merged, 0);

  const mergedByMember = mergedTotal === 0 ? 0 : mergedWithCapy / mergedTotal;

  const loopTriggers = [
    "ci_failed",
    "pr_feedback_human",
    "pr_feedback_bot",
    "review_finding",
  ] as const;

  const loopDays = days.flatMap((day, index) =>
    loopTriggers.flatMap((trigger, triggerIndex) => {
      if ((index + triggerIndex) % 5 !== 0) return [];
      return [
        {
          date: day.date,
          trigger,
          loops: 1 + Math.round(random() * 3),
        },
      ];
    }),
  );

  const hoursDays = days
    .filter((_, index) => index % 2 === 0)
    .map((day) => ({
      date: day.date,
      agentMs: Math.round((0.4 + random() * 2.2) * 60 * 60 * 1000),
    }));

  const loopsTotal = loopDays.reduce((sum, day) => sum + day.loops, 0);
  const agentMsTotal = hoursDays.reduce((sum, day) => sum + day.agentMs, 0);

  const splitDays = (weights: (dayIndex: number) => number) =>
    days.map((day, index) => {
      const scale = weights(index);
      const perMember = members.map((member) =>
        Math.round(scale * member.weight),
      );
      return {
        date: day.date,
        members: perMember,
        others: Math.round(scale * 0.2),
      };
    });

  const memberSplit = (
    totals: ReadonlyArray<number>,
    others: number,
    daysRows: ReadonlyArray<{
      date: string;
      members: ReadonlyArray<number>;
      others: number;
    }>,
  ) => ({
    members: [
      ...members.map((member, index) => ({
        userId: member.userId,
        total: totals[index] ?? 0,
      })),
      { userId: people.jordan.id, total: 12 },
    ],
    others,
    days: daysRows,
  });

  const mergedDays = splitDays((index) => days[index]?.merged ?? 0);
  const loopDaysSplit = splitDays((index) => (index % 5 === 0 ? 2 : 0));
  const hourDaysSplit = splitDays((index) =>
    index % 2 === 0 ? Math.round(agentMsTotal / 180 / 1000) : 0,
  );

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    repoCount: repos.length,
    projectOptions: [
      { id: "proj_web", name: "Web app", repos: [repos[0]!.fullName] },
      { id: "proj_api", name: "API", repos: [repos[1]!.fullName] },
    ],
    membersWithoutLogin: [],
    connectedAt: new Date(now.getTime() - 200 * dayMs).toISOString(),
    merged: count(mergedWithCapy, Math.round(mergedWithCapy * 0.82)),
    mergedAll: count(mergedTotal, Math.round(mergedTotal * 0.86)),
    threadMerged: mergedWithCapy,
    reviewOnlyMerged: Math.max(0, mergedTotal - mergedWithCapy),
    contributed: count(
      Math.round(mergedTotal * 1.11),
      Math.round(mergedTotal * 0.94),
    ),
    findings: count(212, 168),
    loops: count(loopsTotal, Math.round(loopsTotal * 0.77)),
    loopDays,
    agentMs: count(agentMsTotal, Math.round(agentMsTotal * 0.8)),
    hoursDays,
    days,
    touches,
    mergedByMember: memberSplit(
      members.map((member) => Math.round(mergedWithCapy * member.weight * 0.6)),
      Math.round(mergedTotal * 0.35),
      mergedDays,
    ),
    loopsByMember: memberSplit(
      members.map((member) => Math.round(loopsTotal * member.weight * 0.4)),
      Math.round(loopsTotal * 0.3),
      loopDaysSplit,
    ),
    hoursByMember: memberSplit(
      members.map((member) => Math.round(agentMsTotal * member.weight * 0.5)),
      Math.round(agentMsTotal * 0.3),
      hourDaysSplit,
    ),
    serviceUsers: {
      count: 3,
      merged: Math.round(mergedByMember * mergedTotal),
      loops: loopsTotal,
      agentMs: agentMsTotal,
    },
  };
};
