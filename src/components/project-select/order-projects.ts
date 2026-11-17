import { DateTime } from "effect";
import type { Project } from "@/data/api/schemas/project";
import { normalizeQuery, rankItems } from "@/lib/fuzzy-search";

export type ProjectActivityThread = {
  projectId: string | null;
  userId: string;
  updatedAt: Moment;
};

export type Moment = DateTime.DateTime | Date | string | number;

export const toMillis = (value: Moment) =>
  DateTime.isDateTime(value)
    ? DateTime.toEpochMillis(value)
    : new Date(value).getTime();

const time = toMillis;

export function projectActivity(
  projects: readonly Project[],
  threads: readonly ProjectActivityThread[],
  userId: string | undefined,
): Map<string, number> {
  const touched = new Map<string, number>();
  for (const project of projects)
    if (project.lastTouchedAt !== null)
      touched.set(project.id, time(project.lastTouchedAt));
  for (const thread of threads) {
    if (thread.projectId === null || userId === undefined) continue;
    if (thread.userId !== userId) continue;
    const at = time(thread.updatedAt);
    if (at > (touched.get(thread.projectId) ?? 0))
      touched.set(thread.projectId, at);
  }
  return touched;
}

export type OrderedProjects = {
  matches: readonly Project[];
  yours: readonly Project[];
  others: readonly Project[];
  createName: string | undefined;
};

export function orderProjects(
  projects: readonly Project[],
  query: string,
  activity: ReadonlyMap<string, number>,
): OrderedProjects {
  const q = query.trim().toLowerCase();
  const scores = new Map(
    rankItems(
      projects,
      (p) => [p.name, ...p.repos.map((r) => r.repoFullName)],
      q,
    ).map((r) => [r.item.id, r.score]),
  );
  const matches =
    normalizeQuery(q) === ""
      ? projects
      : projects.filter((p) => scores.has(p.id));
  const byScore = (a: Project, b: Project) =>
    (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
  const touchedAt = (p: Project) => activity.get(p.id) ?? 0;
  const yours = matches
    .filter((p) => p.viewerRole !== "none" || activity.has(p.id))
    .toSorted((a, b) => {
      const score = byScore(a, b);
      if (score !== 0) return score;
      if (touchedAt(a) !== touchedAt(b)) return touchedAt(b) - touchedAt(a);
      const updated = time(b.updatedAt) - time(a.updatedAt);
      return updated !== 0 ? updated : a.name.localeCompare(b.name);
    });
  const others = matches
    .filter((p) => p.viewerRole === "none" && !activity.has(p.id))
    .toSorted((a, b) => byScore(a, b) || a.name.localeCompare(b.name));
  return {
    matches,
    yours,
    others,
    createName:
      matches.length === 0 && query.trim() !== "" ? query.trim() : undefined,
  };
}

export function projectDisplayName(
  project: Pick<Project, "name" | "nameIsDerived">,
) {
  const suffix = project.nameIsDerived ? / \+\d+$/.exec(project.name) : null;
  return suffix === null
    ? { base: project.name, suffix: undefined }
    : { base: project.name.slice(0, suffix.index), suffix: suffix[0] };
}
