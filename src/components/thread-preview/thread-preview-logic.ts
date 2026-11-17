import type { ThreadCard } from "@/data/api/schemas/thread";

export const PREVIEW_LIMIT = 3;

export type PreviewAsk = {
  key: string;
  threadId: string;
  text?: string | null;
  causeKey?: string | null;
  stale?: boolean;
};

export type PreviewMachine = { kind: string; name?: string | null };

export type PreviewMember = {
  id: string;
  title: string | null;
  needsYou?: boolean;
  preview?: string | null;
  primaryMachine?: unknown;
};

export type PreviewSection = "asks" | "crew" | "pulls" | "tasks";

export type PreviewThread = Pick<
  ThreadCard,
  "id" | "needsYou" | "status" | "ask" | "crewCount"
>;

export const isCaptain = (thread: Pick<ThreadCard, "crewCount">) =>
  thread.crewCount !== undefined;

export const threadCode = (
  thread: Pick<ThreadCard, "threadNumber">,
  projectCode: string | undefined,
) => {
  if (thread.threadNumber === null) return null;
  return projectCode === undefined
    ? `#${thread.threadNumber}`
    : `${projectCode}-${thread.threadNumber}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const asMachine = (value: unknown): PreviewMachine | undefined =>
  isRecord(value) && typeof value.kind === "string"
    ? {
        kind: value.kind,
        name: typeof value.name === "string" ? value.name : null,
      }
    : undefined;

export const machineLabel = (machine: PreviewMachine) =>
  machine.kind === "device" ? (machine.name ?? "") : "Cloud";

export const asAsk = (value: unknown): PreviewAsk | undefined =>
  isRecord(value) && typeof value.key === "string"
    ? {
        key: value.key,
        threadId: typeof value.threadId === "string" ? value.threadId : "",
        text: typeof value.text === "string" ? value.text : null,
      }
    : undefined;

export const automationName = (value: unknown) =>
  isRecord(value) && typeof value.name === "string" ? value.name : undefined;

export const originLabels = { slack: "Slack", linear: "Linear" } as const;

export const previewOrigin = (origin: ThreadCard["origin"]) =>
  origin === "slack" || origin === "linear" ? origin : undefined;

export const limitSection = <T>(
  expanded: readonly PreviewSection[],
  section: PreviewSection,
  items: readonly T[],
) => (expanded.includes(section) ? items : items.slice(0, PREVIEW_LIMIT));

export const threadAsks = (
  thread: PreviewThread,
  asks: readonly PreviewAsk[] | undefined,
) => {
  const live = (asks ?? []).filter((ask) => !ask.stale);
  const own = live.filter((ask) => ask.threadId === thread.id);
  const captain = isCaptain(thread);
  const fallback = asAsk(thread.ask);
  const header =
    !thread.needsYou || thread.status === "working"
      ? []
      : captain || own.length === 0
        ? fallback === undefined
          ? []
          : [fallback]
        : own;
  const groups = new Map<string, PreviewAsk[]>();
  for (const ask of live) {
    if (!captain || ask.threadId === thread.id) continue;
    const key = ask.causeKey ?? `${ask.threadId}:${ask.key}`;
    groups.set(key, [...(groups.get(key) ?? []), ask]);
  }
  return { header, groups: [...groups.entries()] };
};

export const crewWithoutAsks = <M extends PreviewMember>(
  crew: readonly M[],
  asks: readonly PreviewAsk[] | undefined,
  groups: ReadonlyArray<readonly [string, readonly PreviewAsk[]]>,
) => {
  const asked = new Set(
    groups.flatMap(([, items]) => items.map((ask) => ask.threadId)),
  );
  return crew.filter((member) =>
    asks === undefined ? !member.needsYou : !asked.has(member.id),
  );
};
