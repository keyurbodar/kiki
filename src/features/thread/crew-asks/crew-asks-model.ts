export type CrewAsk = {
  threadId: string;
  key: string;
  causeKey: string | null;
  text: string | null;
  askedAt: Date;
  stale: boolean;
};

export type CrewThread = {
  id: string;
  title: string | null;
  preview?: string;
  glyph?: string;
};

export type CrewAskKey = { threadId: string; key: string };

export type CrewAskItem = {
  id: string;
  opens: string;
  asks: CrewAskKey[];
  title: string;
  text: string;
  glyph: string;
};

export const CREW_ASKS_PAGE = 20;
export const DISMISS_BATCH_LIMIT = 100;

export const groupCrewAsks = (
  asks: readonly CrewAsk[],
  threads: readonly CrewThread[],
  captainId: string,
): CrewAskItem[] => {
  const live = asks
    .filter((ask) => !ask.stale && ask.threadId !== captainId)
    .toSorted((a, b) => b.askedAt.getTime() - a.askedAt.getTime());
  return live.flatMap((ask) => {
    const group =
      ask.causeKey === null
        ? [ask]
        : live.filter((other) => other.causeKey === ask.causeKey);
    if (group[0] !== ask) return [];
    const thread = threads.find((t) => t.id === ask.threadId);
    return [
      {
        id: `${ask.threadId}:${ask.key}`,
        opens: ask.threadId,
        asks: group.map(({ threadId, key }) => ({ threadId, key })),
        title:
          group.length > 1
            ? `${group.length} threads`
            : (thread?.title ?? "Untitled thread"),
        text: ask.text ?? thread?.preview ?? "",
        glyph: thread === undefined ? "waiting" : (thread.glyph ?? "waiting"),
      },
    ];
  });
};

export type DismissBatch = { threadIds: Set<string>; keys: Set<string> };

export const batchDismissals = (asks: readonly CrewAskKey[]) =>
  asks.reduce<DismissBatch[]>((batches, ask) => {
    const last = batches.at(-1);
    if (
      last !== undefined &&
      (last.threadIds.has(ask.threadId) ||
        last.threadIds.size < DISMISS_BATCH_LIMIT) &&
      (last.keys.has(ask.key) || last.keys.size < DISMISS_BATCH_LIMIT)
    ) {
      last.threadIds.add(ask.threadId);
      last.keys.add(ask.key);
      return batches;
    }
    batches.push({
      threadIds: new Set([ask.threadId]),
      keys: new Set([ask.key]),
    });
    return batches;
  }, []);

export const crewAsksLabel = (count: number) =>
  count === 1 ? "1 crew ask" : `${count} crew asks`;

export const crewAsksShortLabel = (count: number) =>
  count === 1 ? "1 ask" : `${count} asks`;
