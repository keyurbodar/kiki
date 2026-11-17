import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";

export type QueueActor =
  | { type: "user"; userId: string }
  | { type: "agent" }
  | { type: "service_user"; serviceUserId: string }
  | { type: "service"; service: string };

export type QueueUpload = {
  status: "uploading" | "uploaded" | "failed";
  progress?: number;
  /** false when the bytes only live in this tab and a reload drops them. */
  kept?: boolean;
};

export type QueueMention = {
  kind: string;
  start: number;
  end: number;
  text: string;
  label: string;
};

/** One queued message. `id` is null until the server admits it. */
export type QueueRowData = {
  id: string | null;
  clientKey?: string;
  text: string;
  mentions: ReadonlyArray<QueueMention>;
  /** queue: sends after the run; interrupt: read when the response finishes. */
  delivery: "queue" | "interrupt";
  actor: QueueActor | null;
  files: ReadonlyArray<unknown>;
  uploads?: ReadonlyArray<QueueUpload>;
  uploadFailure?: string;
};

export type QueueAction = "edit" | "send" | "cancel";
export type LeaveReason = QueueAction | "promote";

/** Stable key across the optimistic (client) and admitted (id) copies of a row. */
export const queueRowKey = (row: Pick<QueueRowData, "id" | "clientKey">) =>
  row.clientKey === undefined ? `id:${row.id}` : `client:${row.clientKey}`;

/** Inline excerpt mentions read as their label, replaced from the end so offsets hold. */
export const queueRowText = (row: Pick<QueueRowData, "text" | "mentions">) =>
  row.mentions
    .filter(
      (mention) =>
        mention.kind === "excerpt" &&
        row.text.slice(mention.start, mention.end) === mention.text,
    )
    .toSorted((a, b) => b.start - a.start)
    .reduce(
      (text, mention) =>
        `${text.slice(0, mention.start)}${mention.label}${text.slice(mention.end)}`,
      row.text,
    );

/** Average upload progress over rows still uploading, or undefined. */
export const uploadProgress = (uploads: ReadonlyArray<QueueUpload>) => {
  const active = uploads.filter((upload) => upload.status === "uploading");
  return active.length === 0
    ? undefined
    : Math.floor(
        active.reduce((sum, upload) => sum + (upload.progress ?? 0), 0) /
          active.length,
      );
};

export type QueueEntry = {
  key: string;
  row: QueueRowData;
  leaving: LeaveReason | undefined;
};

type Exit = { row: QueueRowData; reason: LeaveReason; settled: boolean };

/**
 * Keeps rows that just left the queue on screen with their leave reason so
 * they can animate out, in the order they were shown. Pure core of
 * `useQueueTransitions`, exported for tests.
 */
export const reconcileQueue = (
  state: {
    exits: Map<string, Exit>;
    shown: Map<string, QueueRowData>;
    order: string[];
  },
  rows: ReadonlyArray<QueueRowData>,
  departing: ReadonlyMap<string, LeaveReason>,
  animate: boolean,
): QueueEntry[] => {
  const all = new Map(rows.map((row) => [queueRowKey(row), row]));
  const visible = new Map([...all].filter(([key]) => !departing.has(key)));
  if (animate)
    for (const [key, row] of state.shown)
      if (!visible.has(key) && !state.exits.has(key))
        state.exits.set(key, {
          row,
          reason: departing.get(key) ?? "promote",
          settled: false,
        });
  state.shown = visible;
  const seen = new Set(state.order);
  const entries: QueueEntry[] = [];
  const order: string[] = [];
  for (const key of [
    ...state.order,
    ...[...visible.keys()].filter((key) => !seen.has(key)),
  ]) {
    const row = visible.get(key);
    const exit = state.exits.get(key);
    if (row !== undefined) {
      state.exits.delete(key);
      entries.push({ key, row, leaving: undefined });
      order.push(key);
    } else if (exit !== undefined && !exit.settled) {
      entries.push({ key, row: exit.row, leaving: exit.reason });
      order.push(key);
    } else if (all.has(key)) order.push(key);
    else state.exits.delete(key);
  }
  state.order = order;
  return entries;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useQueueTransitions(
  rows: ReadonlyArray<QueueRowData>,
  departing: ReadonlyMap<string, LeaveReason>,
) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const state = useRef({
    exits: new Map<string, Exit>(),
    shown: new Map<string, QueueRowData>(),
    order: [] as string[],
  });
  const entries = reconcileQueue(
    state.current,
    rows,
    departing,
    !prefersReducedMotion(),
  );
  return {
    entries,
    settleExit: (key: string) => {
      const exit = state.current.exits.get(key);
      if (exit === undefined || exit.settled) return;
      exit.settled = true;
      rerender();
    },
  };
}

/** How long an action waits for an optimistic row to be admitted. */
export const admitTimeoutMs = 6e4;

export type QueueActHandler = (
  action: QueueAction,
  row: QueueRowData,
  id: string,
) => Promise<boolean>;

let actionChain: Promise<unknown> = Promise.resolve();
const enqueueAction = <A>(task: () => Promise<A>) => {
  const next = actionChain.then(task);
  actionChain = next.catch(() => undefined);
  return next;
};

/**
 * Runs queue row actions one at a time, waiting for a row's server id when
 * it is still optimistic, and marks the row as departing meanwhile.
 */
export function useQueueActions(
  rows: ReadonlyArray<QueueRowData>,
  onAct: QueueActHandler,
) {
  const [departing, setDeparting] = useState(
    () => new Map<string, LeaveReason>(),
  );
  const handler = useRef(onAct);
  const latest = useRef(rows);
  const inFlight = useRef(new Set<string>());
  const waiters = useRef(new Map<string, (id: string | undefined) => void>());
  useLayoutEffect(() => {
    handler.current = onAct;
    latest.current = rows;
  });
  useEffect(() => {
    const pending = waiters.current;
    return () => {
      for (const resolve of pending.values()) resolve(undefined);
      pending.clear();
    };
  }, []);
  useEffect(() => {
    const byKey = new Map(rows.map((row) => [queueRowKey(row), row]));
    for (const [key, resolve] of waiters.current) {
      const row = byKey.get(key);
      if (row?.id !== null) {
        waiters.current.delete(key);
        resolve(row?.id ?? undefined);
      }
    }
    setDeparting((current) => {
      const next = new Map([...current].filter(([key]) => byKey.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);
  const act = (row: QueueRowData, action: QueueAction) => {
    const key = queueRowKey(row);
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setDeparting((current) => new Map(current).set(key, action));
    const target =
      latest.current.find((candidate) => queueRowKey(candidate) === key) ?? row;
    const admitted =
      target.id === null
        ? new Promise<string | undefined>((resolve) =>
            waiters.current.set(key, resolve),
          )
        : undefined;
    return enqueueAction(() =>
      (admitted === undefined
        ? Promise.resolve(target.id ?? undefined)
        : Promise.race([
            admitted,
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Queued message did not land: ${key}`)),
                admitTimeoutMs,
              ),
            ),
          ])
      ).then((id) => id !== undefined && handler.current(action, target, id)),
    )
      .catch(() => {
        setDeparting((current) => {
          const next = new Map(current);
          next.delete(key);
          return next;
        });
        return false;
      })
      .finally(() => inFlight.current.delete(key));
  };
  const head = rows.find(
    (row) => row.uploads === undefined && !departing.has(queueRowKey(row)),
  );
  return { departing, act, head };
}
