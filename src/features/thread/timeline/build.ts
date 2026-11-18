import type { EventId, EventRow, UserId } from "@/data/events";
import {
  type DeliveryTool,
  type EventPass,
  eventPass,
  hiddenReasoning,
  isCallRow,
} from "./event-pass";
import { type ExpandedIds, groupRows, type PendingExchange } from "./group";
import {
  COMPACTING_ID,
  HIDDEN_SUFFIX,
  isTool,
  joinText,
  LIVE_EVENT_ID,
  type Row,
  type RowOf,
  STAMP_GAP_MS,
  settledAt,
  THINKING_STANDIN_ID,
} from "./shared";

/**
 * Gives the open turn a "still working" line when its last row settled: a
 * hidden reasoning row after the last settled line, or the last line reopened.
 */
export const markOpenTurn = (
  rows: ReadonlyArray<Row>,
  openTurnId: EventId | undefined,
): ReadonlyArray<Row> => {
  if (openTurnId === undefined) return rows;
  const tools = rows.filter((row) => isTool(row) && row.eventId === openTurnId);
  if (
    tools.some((row) => isTool(row) && row.result === undefined) ||
    (tools.length === 0 &&
      rows.some((row) => row.type === "activity" && row.turnOpen))
  )
    return rows;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index] as Row;
    if (row.type === "update" && row.kind === "operation") continue;
    if (row.type !== "activity" || (row.kind === "reasoning" && row.turnOpen))
      return rows;
    if (
      tools.length > 0 ||
      (row.kind !== "reasoning" &&
        (row.kind !== "tool" || row.result !== undefined))
    ) {
      const at = new Date(
        Math.max(...[row, ...tools].map((entry) => settledAt(entry).getTime())),
      );
      return [...rows, hiddenReasoning(openTurnId, at, at)];
    }
    const reopened = [...rows];
    reopened[index] =
      row.kind === "reasoning"
        ? {
            ...row,
            turnOpen: true,
            createdAt: new Date(row.createdAt.getTime() - row.elapsedMs),
          }
        : { ...row, turnOpen: true };
    return reopened;
  }
  return rows;
};

/** Appends the live turn's rows to the settled timeline. */
export const mergeLive = (
  pass: EventPass,
  live: ReadonlyArray<Row>,
  pending: PendingExchange | undefined,
  liveSettled: boolean,
): ReadonlyArray<Row> => {
  const { ordered, entries, settledTimeline, openTurnId } = pass;
  const settled = () => markOpenTurn(settledTimeline, openTurnId);
  if (
    entries.some((row) => row.type === "marker" && row.live === true) &&
    live.every(
      (row) => row.id === THINKING_STANDIN_ID || row.id === COMPACTING_ID,
    )
  )
    return settledTimeline;
  if (live.some((row) => isCallRow(row) && pass.callIds.has(row.id)))
    return settled();
  const lastAssistant = ordered
    .map((event) => event.kind === "assistant")
    .lastIndexOf(true);
  const assistant = ordered[lastAssistant];
  const lastMessage = ordered
    .map((event) => event.kind === "message")
    .lastIndexOf(true);
  if (
    liveSettled &&
    assistant?.kind === "assistant" &&
    lastMessage < lastAssistant
  ) {
    const stored = new Set(
      entries.flatMap((row) => (row.eventId === assistant.id ? [row.id] : [])),
    );
    if (
      live.length > 0 &&
      live.every((row) => stored.has(row.id) && !isCallRow(row))
    )
      return settled();
  }
  const reopens = live.some(
    (row) =>
      (row.type === "activity" && row.turnOpen) ||
      (row.type === "agent-message" && row.turnCloses),
  );
  const hiddenId = `${openTurnId}${HIDDEN_SUFFIX}`;
  const base = settledTimeline.flatMap((row): Row[] =>
    row.type === "activity"
      ? row.id === hiddenId
        ? []
        : reopens && row.turnOpen
          ? [{ ...row, turnOpen: false }]
          : [row]
      : [row],
  );
  const last = base.at(-1);
  const first = live[0];
  if (
    last?.type === "activity" &&
    last.kind === "reasoning" &&
    first?.type === "activity" &&
    first.kind === "reasoning" &&
    !(
      pending !== undefined &&
      first.createdAt.getTime() >= pending.sentAt.getTime()
    )
  ) {
    const from = last.turnOpen
      ? last.createdAt.getTime()
      : last.createdAt.getTime() - last.elapsedMs;
    const merged: Row = {
      ...last,
      turnOpen: first.turnOpen,
      writing: first.writing,
      createdAt: new Date(from),
      text: joinText(last.text, first.text),
      elapsedMs: first.turnOpen
        ? 0
        : Math.max(0, first.createdAt.getTime() + first.elapsedMs - from),
    };
    return [...base.slice(0, -1), merged, ...live.slice(1)];
  }
  return [...base, ...live];
};

/** Inserts the "New" divider above the first message the viewer hasn't seen. */
export const markNew = (
  rows: ReadonlyArray<Row>,
  newSince: EventId | null | undefined,
  newUntil: EventId | undefined,
  viewerUserId: UserId | undefined,
): ReadonlyArray<Row> => {
  if (newSince === undefined) return rows;
  const fromViewer = (row: Row) =>
    row.type === "user-message" &&
    row.actor.type === "user" &&
    row.actor.userId === viewerUserId;
  const lastOwn =
    [...rows]
      .reverse()
      .find(
        (row) =>
          fromViewer(row) &&
          row.eventId !== LIVE_EVENT_ID &&
          (newUntil === undefined || row.eventId <= newUntil),
      )?.eventId ?? newSince;
  const since =
    newSince === null || (lastOwn !== null && lastOwn > newSince)
      ? lastOwn
      : newSince;
  const index = rows.findIndex(
    (row) =>
      (row.type === "user-message" || row.type === "agent-message") &&
      row.eventId !== LIVE_EVENT_ID &&
      !fromViewer(row) &&
      (since === null || row.eventId > since) &&
      (newUntil === undefined || row.eventId <= newUntil),
  );
  if (index === -1) return rows;
  const first = rows[index] as Row;
  return [
    ...rows.slice(0, index),
    {
      type: "marker",
      kind: "new",
      id: `marker:new:${first.eventId}`,
      eventId: first.eventId,
      createdAt: first.createdAt,
      label: "New",
    },
    ...rows.slice(index),
  ];
};

/** The open clarify card the composer answers, if the turn ended on one. */
export const pendingAskOf = (rows: ReadonlyArray<Row>) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (
      row === undefined ||
      (row.type === "user-message" && row.actor.type !== "agent")
    )
      return undefined;
    if (row.type === "clarify") return row;
  }
  return undefined;
};

/** The newest environment request, while it is still unfulfilled. */
export const pendingEnvironmentOf = (rows: ReadonlyArray<Row>) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row === undefined) return undefined;
    if (row.type === "environment-request")
      return row.fulfilled ? undefined : row;
  }
  return undefined;
};

export interface QueuedMessage {
  readonly id: EventId;
  readonly actor: RowOf<"user-message">["actor"];
  readonly text: string;
  readonly delivery: "queue" | "steer";
  readonly mentions: RowOf<"user-message">["mentions"];
  readonly files: RowOf<"user-message">["files"];
  readonly clientKey: string | undefined;
}

/**
 * Pending queue messages: held until the running turn ends, so the composer
 * shows them as queued chips. A steer or interrupt send reached the turn and is
 * drawn as a row instead.
 */
export const queuedMessages = (
  events: ReadonlyArray<EventRow>,
): ReadonlyArray<QueuedMessage> => {
  const firstByKey = new Map<string, EventId>();
  for (const event of events)
    if (
      event.kind === "message" &&
      event.payload.clientKey !== undefined &&
      !firstByKey.has(event.payload.clientKey)
    )
      firstByKey.set(event.payload.clientKey, event.id);
  return events.flatMap((event): QueuedMessage[] => {
    if (
      event.kind !== "message" ||
      event.state !== "pending" ||
      event.payload.delivery !== "queue"
    )
      return [];
    const key = event.payload.clientKey;
    return [
      {
        id: event.id,
        actor: event.payload.actor,
        text: event.payload.text,
        delivery: event.payload.delivery,
        mentions: event.payload.mentions ?? [],
        files: event.payload.files,
        clientKey:
          key !== undefined && firstByKey.get(key) === event.id
            ? key
            : undefined,
      },
    ];
  });
};

export type Gap = "tight" | "same" | "turn" | "lead" | "stamp";
export interface RowGap {
  readonly gap: Gap;
  readonly stamp?: Date | undefined;
}

const speakerOf = (row: Row) =>
  row.type === "agent-message"
    ? "agent"
    : row.type === "user-message"
      ? row.actor.type === "user"
        ? row.actor.userId
        : row.actor.type === "agent"
          ? row.actor.jamId
          : row.actor.type
      : undefined;

const isTightRow = (row: Row) =>
  row.type === "marker" ||
  (row.type === "user-message" && row.origin.type === "automation");

const leadGap = (row: Row): Gap =>
  row.type === "user-message" ||
  row.type === "marker" ||
  (row.type === "update" && row.kind === "task" && row.outcome !== "archived")
    ? "lead"
    : "tight";

const gapBetween = (row: Row, previous: Row | undefined): Gap =>
  isTightRow(row) || (previous !== undefined && isTightRow(previous))
    ? "tight"
    : previous === undefined || speakerOf(row) === undefined
      ? leadGap(row)
      : speakerOf(previous) === speakerOf(row)
        ? "same"
        : "turn";

/**
 * Spacing above each row, keyed by row id. A user message (or the row after
 * an agent message) an hour or more after the previous row gets a time stamp.
 */
export const rowGaps = (
  rows: ReadonlyArray<Row>,
): ReadonlyMap<string, RowGap> =>
  new Map(
    rows.map((row, index) => {
      const previous = rows[index - 1];
      const turnStart =
        row.type === "user-message" || previous?.type === "agent-message";
      const stamped =
        previous === undefined ||
        (turnStart &&
          row.createdAt.getTime() - previous.createdAt.getTime() >=
            STAMP_GAP_MS);
      return [
        row.id,
        {
          gap:
            stamped && previous !== undefined
              ? "stamp"
              : gapBetween(row, previous),
          stamp: stamped ? row.createdAt : undefined,
        },
      ];
    }),
  );

/**
 * Capy's edit truncation: an edit replaces its message and everything after it,
 * so the timeline shows only what survives. The boundaries are the composer's
 * pending edit plus any message already sent as an edit that hasn't settled;
 * the replacement itself outlives its own boundary because its `editOf` names
 * one.
 */
export const truncateForEdit = (
  rows: ReadonlyArray<Row>,
  editOf: EventId | undefined,
): ReadonlyArray<Row> => {
  const boundaries = new Set<EventId>();
  for (const row of rows)
    if (
      row.type === "user-message" &&
      (row.state === "pending" || row.state === "promoted") &&
      row.editOf !== undefined
    )
      boundaries.add(row.editOf);
  if (editOf !== undefined) boundaries.add(editOf);
  let smallest: EventId | undefined;
  for (const id of boundaries)
    if (smallest === undefined || id < smallest) smallest = id;
  if (smallest === undefined) return rows;
  return rows.filter(
    (row) =>
      row.eventId < smallest ||
      (row.type === "user-message" &&
        row.editOf !== undefined &&
        boundaries.has(row.editOf)),
  );
};

export interface BuildOptions {
  /** The message the composer is editing; its reply and everything after it are held back. */
  readonly editOf?: EventId | undefined;
  readonly liveEntries?: ReadonlyArray<Row> | undefined;
  readonly liveSettled?: boolean | undefined;
  readonly truncatedHistory?: boolean | undefined;
  readonly deliveryTool?: DeliveryTool | undefined;
  readonly pendingExchange?: PendingExchange | undefined;
  readonly turnClosedByRows?: boolean | undefined;
  readonly serverOffsetMs?: number | undefined;
  readonly expandedGroupIds?: ExpandedIds | undefined;
  readonly newSince?: EventId | null | undefined;
  readonly newUntil?: EventId | undefined;
  readonly viewerUserId?: UserId | undefined;
}

export interface Timeline {
  readonly rows: ReadonlyArray<Row>;
  readonly gaps: ReadonlyMap<string, RowGap>;
  readonly pendingAsk: RowOf<"clarify"> | undefined;
  readonly pendingEnvironment: RowOf<"environment-request"> | undefined;
  readonly queued: ReadonlyArray<QueuedMessage>;
  readonly turnOpen: boolean;
}

const passCache = new WeakMap<
  ReadonlyArray<EventRow>,
  Map<string, EventPass>
>();

const cachedPass = (
  events: ReadonlyArray<EventRow>,
  truncated: boolean,
  deliveryTool: DeliveryTool,
  turnClosedByRows: boolean,
) => {
  const key = `${truncated}:${deliveryTool}:${turnClosedByRows}`;
  const cached = passCache.get(events)?.get(key);
  if (cached !== undefined) return cached;
  const pass = eventPass(events, truncated, deliveryTool, turnClosedByRows);
  const byKey = passCache.get(events) ?? new Map<string, EventPass>();
  byKey.set(key, pass);
  passCache.set(events, byKey);
  return pass;
};

/**
 * Capy's transcript row builder: stored events plus the live turn to timeline
 * rows, with the spacing between them.
 */
export const buildTimeline = (
  events: ReadonlyArray<EventRow>,
  options: BuildOptions = {},
): Timeline => {
  const pass = cachedPass(
    events,
    options.truncatedHistory ?? false,
    options.deliveryTool ?? "message_user",
    options.turnClosedByRows ?? false,
  );
  const liveRows = options.liveEntries ?? [];
  const calls = new Map(
    liveRows.flatMap((row) =>
      isTool(row) && row.liveCalls !== undefined
        ? [[row.id, row.liveCalls] as const]
        : [],
    ),
  );
  const streaming = liveRows.filter(
    (row) => !isTool(row) || row.liveCalls === undefined,
  );
  const merged =
    streaming.length === 0
      ? markOpenTurn(pass.settledTimeline, pass.openTurnId)
      : mergeLive(
          pass,
          streaming,
          options.pendingExchange,
          options.liveSettled ?? false,
        );
  const offset = options.serverOffsetMs ?? 0;
  const interrupts = merged.filter(
    (row) =>
      row.type === "user-message" &&
      row.state === "pending" &&
      row.delivery === "interrupt",
  );
  const placed = merged.filter((row) => !interrupts.includes(row));
  for (const row of interrupts) {
    const at = row.createdAt.getTime() + offset;
    const index = placed.findIndex(
      (entry) =>
        entry.eventId === LIVE_EVENT_ID && entry.createdAt.getTime() >= at,
    );
    placed.splice(index === -1 ? placed.length : index, 0, row);
  }
  const withCalls =
    calls.size === 0
      ? placed
      : placed.map((row): Row => {
          const live = calls.get(row.id);
          return isTool(row) && row.result === undefined && live !== undefined
            ? { ...row, liveCalls: live }
            : row;
        });
  const visible = truncateForEdit(withCalls, options.editOf);
  const rows = groupRows(
    markNew(visible, options.newSince, options.newUntil, options.viewerUserId),
    {
      expandedGroupIds: options.expandedGroupIds ?? new Map(),
      pendingExchange: options.pendingExchange,
    },
  );
  return {
    rows,
    gaps: rowGaps(rows),
    pendingAsk: pendingAskOf(visible),
    pendingEnvironment: pendingEnvironmentOf(visible),
    queued: queuedMessages(pass.ordered),
    turnOpen: rows.some(
      (row) =>
        (row.type === "work-group" && row.live) ||
        (row.type === "agent-message" && !row.settled && !row.interrupted),
    ),
  };
};
