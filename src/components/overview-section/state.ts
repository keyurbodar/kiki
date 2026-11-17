import { Schema } from "effect";
import { KeyValueStore } from "effect/persistence";
import { Atom } from "effect/reactivity";

export const OVERVIEW_SECTION_IDS = [
  "digest",
  "issues_needs_you",
  "issues_new",
  "issues_in_progress",
  "todos",
  "tasks",
  "pulls",
  "apps",
  "side_threads",
  "subscriptions",
  "automations",
  "threads",
  "files",
] as const;

export type OverviewSectionId = (typeof OVERVIEW_SECTION_IDS)[number];

export const PULL_SORTS = [
  "updated",
  "opened",
  "largest",
  "smallest",
  "repo",
  "status",
] as const;

export type PullSort = (typeof PULL_SORTS)[number];

export const OVERVIEW_SECTION_LIMIT = 10;

const SectionIds = Schema.Array(Schema.Literals(OVERVIEW_SECTION_IDS));

const storage = Atom.runtime(
  KeyValueStore.layerStorage(() => globalThis.localStorage),
);

export const overviewCollapsedSectionsAtom = Atom.family((jamId: string) =>
  Atom.keepAlive(
    Atom.kvs({
      runtime: storage,
      key: `capy-web:overview-sections:${jamId}`,
      schema: SectionIds,
      defaultValue: (): ReadonlyArray<OverviewSectionId> => [],
    }),
  ),
);

export const overviewExpandedSectionsAtom = Atom.family((jamId: string) =>
  Atom.keepAlive(
    Atom.kvs({
      runtime: storage,
      key: `capy-web:overview-sections-expanded:${jamId}`,
      schema: SectionIds,
      defaultValue: (): ReadonlyArray<OverviewSectionId> => [],
    }),
  ),
);

export const overviewPullSortAtom = Atom.keepAlive(
  Atom.kvs({
    runtime: storage,
    key: "capy-web:overview-pull-sort",
    schema: Schema.Literals(PULL_SORTS),
    defaultValue: (): PullSort => "updated",
  }),
);

export const toggleSection = (
  ids: ReadonlyArray<OverviewSectionId>,
  id: OverviewSectionId,
  present: boolean,
): ReadonlyArray<OverviewSectionId> =>
  present
    ? ids.includes(id)
      ? ids
      : [...ids, id]
    : ids.filter((candidate) => candidate !== id);

export const hiddenRowCount = (total: number, expanded: boolean) =>
  expanded ? 0 : Math.max(0, total - OVERVIEW_SECTION_LIMIT);

export const visibleRows = <T>(rows: ReadonlyArray<T>, expanded: boolean) =>
  rows.slice(0, expanded ? rows.length : OVERVIEW_SECTION_LIMIT);

export type SectionMore = {
  loading: boolean;
  retry: boolean;
  onLoad: () => void;
};

export const moreLabel = (more: SectionMore) =>
  more.loading ? "Loading…" : more.retry ? "Retry" : "Show more";
