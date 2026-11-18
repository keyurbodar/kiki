import type { EventId } from "@/data/events";
import {
  type ActivityRow,
  asRecord,
  executeData,
  isTool,
  isWaitTool,
  LIVE_EVENT_ID,
  type Row,
  readArray,
  readNumber,
  readString,
  SETUP_TOOLS,
  type Settlement,
  settledAt,
  startOf,
  type ToolRow,
  toolNamespace,
  type UpdateRow,
} from "./shared";

export type ExpandedIds = ReadonlyMap<string, boolean>;

export interface PendingExchange {
  readonly id: string;
  readonly sentAt: Date;
}

export interface GroupOptions {
  readonly expandedGroupIds: ExpandedIds;
  readonly pendingExchange?: PendingExchange | undefined;
}

interface Exchange {
  readonly id: string;
  readonly entries: Row[];
}

/** Splits rows into exchanges: each starts at a user message. */
export const exchangesOf = (
  rows: ReadonlyArray<Row>,
  pending: PendingExchange | undefined,
): Exchange[] => {
  const exchanges: Exchange[] = [];
  let current: Exchange | undefined;
  for (const row of rows) {
    if (
      pending !== undefined &&
      current?.id !== pending.id &&
      row.eventId === LIVE_EVENT_ID &&
      row.createdAt.getTime() >= pending.sentAt.getTime()
    ) {
      current = { id: pending.id, entries: [row] };
      exchanges.push(current);
      continue;
    }
    if (current === undefined || row.type === "user-message") {
      current = {
        id: `exchange:${
          row.type === "agent-message" && row.interrupted
            ? (row.exchangeEventId ?? row.eventId)
            : row.type === "user-message" && row.clientKey !== undefined
              ? `client:${row.clientKey}`
              : row.eventId
        }`,
        entries: [],
      };
      exchanges.push(current);
    }
    current.entries.push(row);
  }
  return exchanges;
};

/** The program calls an `execute` line ran, as their own tool lines. */
export const programEntries = (tool: ToolRow): ReadonlyArray<ToolRow> => {
  const result = tool.result;
  if (result === undefined)
    return (tool.liveCalls ?? []).map(({ index, call, phase }) => ({
      type: "activity",
      kind: "tool",
      id: `${tool.id}:${index}`,
      eventId: tool.eventId,
      createdAt: tool.createdAt,
      startedAt: tool.startedAt,
      turnOpen: false,
      turnCloses: false,
      toolName: call.tool,
      namespace: toolNamespace(call.tool),
      args: call.input,
      phase,
      untimed: true,
      call,
      result:
        phase === "forming" || phase === "running"
          ? undefined
          : {
              blocks:
                call.error === undefined
                  ? []
                  : [{ type: "text" as const, text: call.error }],
              data: call.data,
              isError: phase === "failed",
              settledAt: tool.createdAt,
            },
    }));
  return (executeData(result.data)?.calls ?? []).map((call, index) => {
    const completion = tool.completions?.get(index);
    const settlement: Settlement =
      completion === undefined
        ? {
            blocks:
              call.error === undefined
                ? []
                : [
                    {
                      type: "text",
                      text: call.error.replace(/^[\w.]+ \(call #\d+\): /, ""),
                    },
                  ],
            data: call.data,
            isError: call.error !== undefined,
            settledAt: result.settledAt,
          }
        : { ...completion, data: call.data };
    return {
      type: "activity",
      kind: "tool",
      id: `${tool.id}:${index}`,
      eventId: tool.eventId,
      createdAt: tool.createdAt,
      startedAt: tool.startedAt,
      turnOpen: false,
      turnCloses: false,
      toolName: call.tool,
      namespace: toolNamespace(call.tool),
      args: call.input,
      phase: settlement.isError ? "failed" : "done",
      result: settlement,
      untimed: true,
      call: {
        tool: call.tool,
        input: call.input,
        data: call.data,
        error: call.error,
      },
    };
  });
};

const toolsOf = (row: ToolRow) =>
  row.toolName === "execute" ? programEntries(row) : [row];

const isVisual = (row: Row, phase: "failed" | "done") =>
  isTool(row) && row.toolName === "show_visual" && row.phase === phase;

/** Failed visuals that a later visual in the exchange replaced. */
const revisedVisuals = (rows: ReadonlyArray<Row>) =>
  new Set(
    rows.flatMap((row, index) =>
      isVisual(row, "failed") &&
      rows.slice(index + 1).some((later) => isVisual(later, "done"))
        ? [row.id]
        : [],
    ),
  );

const markRevised = (rows: ReadonlyArray<Row>, revised: ReadonlySet<string>) =>
  rows.map(
    (row): Row =>
      isVisual(row, "failed") && revised.has(row.id)
        ? ({ ...row, phase: "done", revised: true } as Row)
        : row,
  );

const failureKey = (toolName: string, args: unknown) =>
  `${toolName}:${JSON.stringify(args)}`;

/**
 * Failed tool calls in a group, not counting a failure the agent later retried
 * with the same call successfully.
 */
export const failureEntries = (
  rows: ReadonlyArray<Row>,
): ReadonlyArray<{ readonly key: string; readonly failed: boolean }> =>
  rows.flatMap((row) => {
    if (!isTool(row) || row.result === undefined) return [];
    if (row.toolName !== "execute")
      return [
        {
          key: failureKey(row.toolName, row.args),
          failed: row.phase === "failed",
        },
      ];
    const calls = programEntries(row);
    return [
      ...calls.map((call) => ({
        key: failureKey(call.toolName, call.args),
        failed: call.phase === "failed",
      })),
      {
        key: failureKey(row.toolName, row.args),
        failed:
          row.result.isError && !calls.some((call) => call.phase === "failed"),
      },
    ];
  });

export const countFailures = (rows: ReadonlyArray<Row>): number =>
  rows
    .flatMap((row) => {
      if (!isTool(row) || row.result === undefined) return [];
      if (row.toolName !== "execute")
        return [
          {
            key: failureKey(row.toolName, row.args),
            failed: row.phase === "failed",
          },
        ];
      const calls = programEntries(row);
      return [
        ...calls.map((call) => ({
          key: failureKey(call.toolName, call.args),
          failed: call.phase === "failed",
        })),
        {
          key: failureKey(row.toolName, row.args),
          failed:
            row.result.isError &&
            !calls.some((call) => call.phase === "failed"),
        },
      ];
    })
    .reduceRight(
      (acc, entry) => {
        if (!entry.failed) acc.retried.add(entry.key);
        else if (!acc.retried.has(entry.key)) acc.count += 1;
        return acc;
      },
      { count: 0, retried: new Set<string>() },
    ).count;

/** True when work pauses after this line (it slept, or it was a wait). */
const pausesAfter = (rows: ReadonlyArray<Row>, index: number) => {
  const row = rows[index];
  return (
    row !== undefined &&
    row.type === "activity" &&
    index < rows.length - 1 &&
    (row.sleptAfter === true ||
      (row.kind === "tool" && isWaitTool(row.toolName, row.result?.data)))
  );
};

/** Active time: summed spans of consecutive activity, split at pauses. */
export const activeTime = (rows: ReadonlyArray<Row>): number => {
  let total = 0;
  let from: number | undefined;
  let to: number | undefined;
  const flush = () => {
    if (from !== undefined && to !== undefined) total += Math.max(0, to - from);
    from = undefined;
    to = undefined;
  };
  for (const [index, row] of rows.entries()) {
    if (row.type !== "activity") {
      flush();
      continue;
    }
    from ??= startOf(row).getTime();
    to = settledAt(row).getTime();
    if (pausesAfter(rows, index)) flush();
  }
  flush();
  return total;
};

/** Index of the first line of the trailing run of unpaused activity. */
const trailingRun = (rows: ReadonlyArray<Row>) => {
  let start: number | undefined;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (
      row === undefined ||
      row.type !== "activity" ||
      pausesAfter(rows, index)
    )
      break;
    start = index;
  }
  return start;
};

export interface Waiting {
  readonly description: string;
  readonly since: Date;
  readonly operationIds: ReadonlyArray<string>;
}

/** The wait a group ends on, when its last line parked the turn. */
export const waitingOf = (rows: ReadonlyArray<Row>): Waiting | undefined => {
  const last = [...rows].reverse().find((row) => row.type === "activity");
  if (
    !isTool(last) ||
    last.waitResolvedAt !== undefined ||
    last.result === undefined ||
    last.result.isError ||
    !isWaitTool(last.toolName, last.result.data) ||
    asRecord(last.result.data).already_finished === true
  )
    return undefined;
  const first = rows.find(
    (row) => isTool(row) && isWaitTool(row.toolName, row.result?.data),
  );
  return {
    description:
      readString(last.args, "description") ??
      executeData(last.result.data)?.wait?.description ??
      "Waiting",
    since: first?.createdAt ?? last.createdAt,
    operationIds: readArray(last.args, "operation_ids").filter(
      (id): id is string => typeof id === "string",
    ),
  };
};

const sameWait = (a: Waiting, b: Waiting) =>
  a.description === b.description ||
  a.operationIds.some((id) => b.operationIds.includes(id));

const familyOf = (row: Row) => {
  if (!isTool(row)) return undefined;
  if (row.toolName === "read") return "explore";
  if (row.toolName.startsWith("pr_") && row.toolName !== "pr_create")
    return "pr";
  return undefined;
};

export type Chunk =
  | {
      readonly kind: "entry";
      readonly entry: Row;
      readonly open?: boolean | undefined;
    }
  | {
      readonly kind: "batch";
      readonly id: string;
      readonly batch: "explore" | "pr" | "mixed";
      readonly entries: ReadonlyArray<Row>;
      readonly clock?: ToolRow | undefined;
      readonly active: boolean;
      readonly expanded: boolean;
    };

/**
 * A group's display chunks: runs of reads or PR reads fold into a batch, and
 * an `execute` with several program calls becomes a "mixed" batch.
 */
export const chunksOf = (
  rows: ReadonlyArray<Row>,
  expanded: ExpandedIds,
): ReadonlyArray<Chunk> => {
  interface Draft {
    family: "explore" | "pr" | "mixed" | undefined;
    first: Row;
    entries: Row[];
    active: boolean;
    open?: boolean;
    clock?: ToolRow;
  }
  const drafts: Draft[] = [];
  for (const row of rows) {
    const program = isTool(row) && row.toolName === "execute" ? row : undefined;
    const previous = drafts.at(-1);
    if (program === undefined) {
      const family = familyOf(row);
      if (family !== undefined && previous?.family === family)
        previous.entries.push(row);
      else drafts.push({ family, first: row, entries: [row], active: false });
      continue;
    }
    const calls = programEntries(program);
    const only = calls.length === 1 ? calls[0] : undefined;
    if (
      only !== undefined ||
      (calls.length === 0 && program.result !== undefined)
    ) {
      const entry = { ...(only ?? program), id: row.id, untimed: false } as Row;
      drafts.push({
        family: undefined,
        first: entry,
        entries: [entry],
        active: false,
        open: expanded.get(`batch:${row.id}`) ?? false,
      });
    } else
      drafts.push({
        family: "mixed",
        first: row,
        entries: [...calls],
        active: program.result === undefined,
        clock: program,
      });
  }
  return drafts.flatMap((draft): Chunk[] => {
    if (draft.family === undefined)
      return draft.entries.map((entry) => ({
        kind: "entry",
        entry,
        open: draft.open,
      }));
    const id = `batch:${draft.first.id}`;
    return [
      {
        kind: "batch",
        id,
        batch: draft.family,
        entries: draft.entries,
        clock: draft.clock,
        active: draft.active,
        expanded: expanded.get(id) ?? false,
      },
    ];
  });
};

type SummaryRow = Extract<Row, { type: "summary" }>;
type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U[] : T[K];
};
type SummaryDraft = Mutable<
  Pick<
    SummaryRow,
    | "prs"
    | "ports"
    | "environmentRequests"
    | "setup"
    | "automations"
    | "appearances"
  >
> & { trigger: Row | undefined };

const emptySummary = (): SummaryDraft => ({
  prs: [],
  ports: [],
  environmentRequests: [],
  setup: [],
  automations: [],
  appearances: [],
  trigger: undefined,
});

const pullOrPort = (tool: ToolRow) => {
  if (
    (tool.toolName !== "pr_create" && tool.toolName !== "expose_port") ||
    tool.result === undefined ||
    tool.result.isError
  )
    return undefined;
  const data = tool.result.data;
  if (tool.toolName === "pr_create") {
    const number = readNumber(data, "number");
    const url = readString(data, "url");
    return number === undefined || url === undefined
      ? undefined
      : ({
          kind: "pr",
          number,
          url,
          alreadyExists: asRecord(data).already_exists === true,
        } as const);
  }
  const port = readNumber(data, "port");
  const machineId = readString(data, "machine_id");
  return port === undefined || machineId === undefined
    ? undefined
    : ({
        kind: "port",
        title: readString(tool.args, "title") ?? `Port ${port}`,
        owningJamId: readString(data, "jam_id"),
        machineId,
        port,
      } as const);
};

const setupChange = (tool: ToolRow) => {
  if (
    !SETUP_TOOLS.has(tool.toolName) ||
    tool.result === undefined ||
    tool.result.isError
  )
    return undefined;
  const data = tool.result.data;
  if (tool.toolName === "environment_apply_setup") {
    const versionId = readString(data, "active_version");
    return versionId === undefined
      ? undefined
      : {
          kind: "version",
          toolCallId: tool.id,
          versionId,
          machineSize: readString(data, "vm_size"),
        };
  }
  if (tool.toolName === "environment_build_snapshot") {
    const buildId = readString(data, "build_id");
    return buildId === undefined
      ? undefined
      : {
          kind: "build",
          toolCallId: tool.id,
          buildId,
          test: asRecord(tool.args).test === true,
        };
  }
  const enabled = asRecord(tool.args).enabled;
  return typeof enabled === "boolean"
    ? { kind: "snapshots", toolCallId: tool.id, enabled }
    : undefined;
};

const automationsOf = (row: Row) =>
  !isTool(row) || row.toolName !== "execute" || row.result === undefined
    ? []
    : (executeData(row.result.data)?.calls ?? []).flatMap((call, index) => {
        if (call.tool !== "automation_create" || call.error !== undefined)
          return [];
        const id = readString(call.data, "id");
        const name = readString(call.data, "name");
        return id === undefined || name === undefined
          ? []
          : [
              {
                toolCallId: `${row.id}:${index}`,
                automationId: id,
                name,
                bound: readString(call.input, "thread") === "this",
              },
            ];
      });

const visualsOf = (tool: ToolRow) => {
  const title = readString(tool.args, "title");
  const html = readString(tool.args, "html");
  return tool.toolName !== "show_visual" ||
    tool.result === undefined ||
    tool.result.isError ||
    title === undefined ||
    html === undefined
    ? []
    : [{ toolCallId: tool.id, title, html }];
};

const isWorkLine = (row: Row) =>
  row.type === "update" ||
  (row.type === "activity" && (row.kind === "tool" || row.kind === "text"));

/**
 * Groups each exchange: runs of activity fold into a work group, cards and
 * messages stand alone, and an exchange that produced PRs, ports, setup or
 * automation changes ends in a summary card.
 */
export const groupRows = (
  rows: ReadonlyArray<Row>,
  options: GroupOptions,
): ReadonlyArray<Row> => {
  const out: Row[] = [];
  const exchanges = exchangesOf(rows, options.pendingExchange);
  const seenPrs = new Set<string>();
  const seenPorts = new Set<string>();
  const seenSetup = new Set<string>();
  const seenAutomations = new Set<string>();
  const expandedIds = options.expandedGroupIds;
  for (const [exchangeIndex, exchange] of exchanges.entries()) {
    const footerId = exchange.entries.some(
      (row) =>
        (row.type === "activity" && row.turnOpen) ||
        (row.type === "agent-message" && !row.settled && !row.interrupted),
    )
      ? undefined
      : [...exchange.entries]
          .reverse()
          .find((row) => row.type === "agent-message" && row.settled)?.id;
    const pending: Row[] = [];
    const revised = revisedVisuals(exchange.entries);
    let lastAt: Date | undefined;
    let groupFrom: Date | undefined;
    let groupCount = 0;
    let summaryCount = 0;
    let summary = emptySummary();
    let parked: { eventId: EventId; park: boolean } | null = null;
    let waitingGroup: number | undefined;

    const flushGroup = (message?: Extract<Row, { type: "agent-message" }>) => {
      const entries = markRevised(pending, revised);
      const first = entries[0];
      if (first === undefined) return;
      const id = `group:${exchange.id}:${groupCount}`;
      groupCount += 1;
      const open = entries.find(
        (row) => row.type === "activity" && row.turnOpen,
      );
      const lastEnd =
        message?.startedAt === undefined
          ? undefined
          : Math.max(
              message.startedAt.getTime(),
              settledAt(entries.at(-1) ?? first).getTime(),
            );
      const activeMs =
        activeTime(entries) +
        (message === undefined || lastEnd === undefined
          ? 0
          : Math.max(0, message.createdAt.getTime() - lastEnd));
      let before = groupFrom;
      let firstActivity: Date | undefined;
      for (const row of entries) {
        if (row.type === "activity") {
          firstActivity = row.createdAt;
          break;
        }
        before = row.createdAt;
      }
      const gapMs =
        firstActivity === undefined || before === undefined
          ? 0
          : Math.max(0, firstActivity.getTime() - before.getTime());
      const runStart =
        open === undefined
          ? undefined
          : (trailingRun(entries) ?? entries.length - 1);
      const runFirst = runStart === undefined ? undefined : entries[runStart];
      const startedAt =
        runFirst === undefined || runStart === undefined
          ? undefined
          : new Date(
              (runFirst.type === "activity"
                ? startOf(runFirst)
                : runFirst.createdAt
              ).getTime() - activeTime(entries.slice(0, runStart)),
            );
      const live = runFirst !== undefined && runFirst.eventId === LIVE_EVENT_ID;
      const waiting = waitingOf(entries);
      const previous =
        waitingGroup === undefined ? undefined : out[waitingGroup];
      if (
        open === undefined &&
        waiting !== undefined &&
        previous?.type === "work-group" &&
        previous.waiting !== undefined &&
        sameWait(previous.waiting as Waiting, waiting)
      ) {
        const merged = markRevised(
          [...previous.entries, ...entries] as Row[],
          revised,
        );
        out[waitingGroup as number] = {
          ...previous,
          activeMs: previous.activeMs + (activeMs > 0 ? activeMs : gapMs),
          entries: merged as never,
          chunks: chunksOf(merged, expandedIds),
          failures: countFailures(merged),
          waiting: waitingOf(merged),
        };
        pending.length = 0;
        return;
      }
      if (open === undefined && waiting !== undefined)
        waitingGroup = out.length;
      out.push({
        type: "work-group",
        id,
        exchangeId: exchange.id,
        eventId: first.eventId,
        createdAt: first.createdAt,
        activeMs: activeMs > 0 ? activeMs : gapMs,
        failures: countFailures(entries),
        entries: entries as never,
        chunks: chunksOf(entries, expandedIds),
        live: open !== undefined,
        startedAt: live ? startedAt : undefined,
        startedAtServer: live ? undefined : startedAt,
        waiting,
        expanded: expandedIds.get(id) ?? false,
      });
      pending.length = 0;
    };

    const flushSummary = (emit: boolean) => {
      const done = summary;
      summary = emptySummary();
      const index = summaryCount;
      summaryCount += 1;
      if (!emit || done.trigger === undefined) return;
      out.push({
        type: "summary",
        id: `summary:${exchange.id}:${index}`,
        exchangeId: exchange.id,
        eventId: done.trigger.eventId,
        createdAt: done.trigger.createdAt,
        prs: done.prs,
        ports: done.ports,
        environmentRequests: done.environmentRequests,
        setup: done.setup,
        automations: done.automations,
        appearances: done.appearances,
      });
    };

    const closeTurn = () => {
      if (parked === null) return;
      parked = null;
      flushGroup();
      flushSummary(true);
    };

    const queue = (row: Row) => {
      if (pending.length === 0) groupFrom = lastAt;
      pending.push(row);
      lastAt = row.createdAt;
    };

    for (const row of exchange.entries) {
      if (row.type === "clarify") {
        if (row.turnCloses) parked = { eventId: row.eventId, park: false };
      } else if (row.type === "environment-request") {
        if (!row.fulfilled) {
          summary.environmentRequests.push(row.request);
          summary.trigger = row;
        }
        if (row.turnCloses) parked = { eventId: row.eventId, park: false };
      } else if (
        row.type === "mcp-setup" ||
        row.type === "desktop-request" ||
        row.type === "terminal-request" ||
        row.type === "feedback-request"
      ) {
        closeTurn();
        flushGroup();
        if (
          (row.type === "desktop-request" || row.type === "terminal-request") &&
          row.turnCloses
        )
          flushSummary(true);
        out.push({ ...row, exchangeId: exchange.id });
        if (row.turnCloses) parked = { eventId: row.eventId, park: false };
        lastAt = row.createdAt;
      } else if (row.type === "activity") {
        if (
          parked !== null &&
          row.eventId !== parked.eventId &&
          row.kind !== "reasoning"
        )
          parked = null;
        if (row.turnCloses) {
          const previous = parked as { eventId: EventId; park: boolean } | null;
          const waits =
            row.kind === "tool" &&
            row.result?.isError === false &&
            isWaitTool(row.toolName, row.result.data);
          parked = {
            eventId: row.eventId,
            park: waits || (previous?.eventId === row.eventId && previous.park),
          };
        }
        for (const tool of row.kind === "tool" ? toolsOf(row) : []) {
          const made = pullOrPort(tool);
          if (made?.kind === "pr" && !seenPrs.has(made.url)) {
            seenPrs.add(made.url);
            summary.prs.push(made);
            summary.trigger = row;
          }
          if (made?.kind === "port") {
            const key = `${made.machineId}:${made.port}`;
            if (!seenPorts.has(key)) {
              seenPorts.add(key);
              summary.ports.push(made);
              summary.trigger = row;
            }
          }
          const setup = setupChange(tool);
          if (setup !== undefined && !seenSetup.has(setup.toolCallId)) {
            seenSetup.add(setup.toolCallId);
            summary.setup.push(setup);
            summary.trigger = row;
          }
          if (tool.toolName === "appearance_set" && tool.result !== undefined) {
            summary.appearances.push({
              toolCallId: tool.id,
              input: tool.args,
              data: tool.result.data,
              error: tool.result.isError
                ? tool.result.blocks
                    .flatMap((block) =>
                      block.type === "text" ? [block.text] : [],
                    )
                    .join("\n") || "Appearance could not be updated"
                : undefined,
            });
            summary.trigger = row;
          }
        }
        for (const automation of automationsOf(row))
          if (!seenAutomations.has(automation.toolCallId)) {
            seenAutomations.add(automation.toolCallId);
            summary.automations.push(automation);
            summary.trigger = row;
          }
        const visuals =
          row.kind === "tool" ? toolsOf(row).flatMap(visualsOf) : [];
        if (visuals.length > 0) {
          if (row.kind === "tool" && row.toolName === "execute") queue(row);
          flushGroup();
          out.push(
            ...visuals.map(
              (visual): Row => ({
                ...visual,
                toolCallId: visual.toolCallId as never,
                type: "visual",
                id: `visual:${visual.toolCallId}`,
                exchangeId: exchange.id,
                eventId: row.eventId,
                createdAt: row.createdAt,
              }),
            ),
          );
          lastAt = row.createdAt;
          continue;
        }
        queue(row);
      } else if (row.type === "update" && row.kind === "operation") {
        if (parked?.park !== true) closeTurn();
        queue(row);
      } else if (row.type === "update") {
        // Capy keeps a notice inside the work group that was running when it
        // landed, so the group's line can summarise it and its row sits in the
        // panel in place. A group with no work line yet, and any update that
        // asks something of the person, still stands on its own.
        if (row.kind === "notice" && pending.some(isWorkLine)) {
          queue(row);
          continue;
        }
        parked = null;
        const last = pending.at(-1);
        if (last?.type === "activity" && last.sleptAfter === undefined)
          pending[pending.length - 1] = {
            ...last,
            sleptAfter: true,
          } as ActivityRow;
        const expandable =
          row.kind === "task" ||
          (row.kind === "notice" &&
            (asRecord(row.filesCopied).files !== undefined ||
              asRecord(row.issueActivity).body !== undefined ||
              asRecord(row.prFeedback).body !== undefined ||
              asRecord(row.slackMessage).text !== undefined));
        out.push(
          expandable
            ? {
                ...row,
                exchangeId: exchange.id,
                expanded: expandedIds.get(row.id) ?? false,
              }
            : { ...row, exchangeId: exchange.id },
        );
        lastAt = row.createdAt;
      } else {
        closeTurn();
        flushGroup(row.type === "agent-message" ? row : undefined);
        out.push(
          row.type === "agent-message"
            ? {
                ...row,
                exchangeId: exchange.id,
                showFooter: row.id === footerId,
              }
            : row.type === "user-message"
              ? {
                  ...row,
                  exchangeId: exchange.id,
                  expanded:
                    expandedIds.get(
                      row.clientKey === undefined
                        ? row.id
                        : `client:${row.clientKey}`,
                    ) ?? false,
                }
              : row.type === "marker" && row.members !== undefined
                ? {
                    ...row,
                    exchangeId: exchange.id,
                    expanded: expandedIds.get(row.id) ?? false,
                  }
                : { ...row, exchangeId: exchange.id },
        );
        if (row.type === "agent-message" && row.turnCloses)
          parked = { eventId: row.eventId, park: false };
        lastAt = row.createdAt;
      }
    }
    closeTurn();
    flushGroup();
    flushSummary(exchangeIndex < exchanges.length - 1);
  }
  return clusterRows(out, expandedIds);
};

const needsPerson = (row: UpdateRow) =>
  row.kind === "task"
    ? row.deliveryState === "needs_you" &&
      row.outcome === "completed" &&
      row.reference.kind === "thread" &&
      row.needs === "person"
    : row.kind === "notice" &&
      (row.notificationKey === "task_blocked" ||
        row.notificationKey === "pr_feedback");

const clusterable = (row: Row) =>
  row.type === "update"
    ? !needsPerson(row)
    : row.type === "work-group" && !row.live;

const quietNotices = new Set([
  "background_command_finished",
  "background_command_failed",
  "hook_output",
  "hook_stopped",
  "informational",
  "local_command_output",
  "model_fallback",
  "review_mode_entered",
  "review_mode_exited",
]);

const startsCluster = (row: Row) =>
  row.type === "update" &&
  row.kind !== "operation" &&
  !(row.kind === "notice" && quietNotices.has(row.notificationKey));

/** Folds runs of updates (and settled work groups between them) into clusters. */
export const clusterRows = (
  rows: ReadonlyArray<Row>,
  expanded: ExpandedIds,
): ReadonlyArray<Row> => {
  const out: Row[] = [];
  let members: Row[] = [];
  const flush = () => {
    const first = members[0];
    if (first === undefined) return;
    if (
      members.length === 1 &&
      first.type === "update" &&
      first.kind !== "task"
    ) {
      out.push(first);
      members = [];
      return;
    }
    const id = `cluster:${first.id}`;
    out.push({
      type: "cluster",
      id,
      exchangeId: first.exchangeId,
      eventId: first.eventId,
      createdAt: first.createdAt,
      members: members as never,
      expanded:
        expanded.get(id) ??
        (members.length > 1 &&
          members.length <= 5 &&
          members.every(
            (member) =>
              member.type === "update" &&
              member.kind === "task" &&
              member.outcome === "archived" &&
              member.reference.kind === "thread",
          )),
    });
    members = [];
  };
  for (const row of rows)
    if (clusterable(row) && (members.length > 0 || startsCluster(row)))
      members.push(row);
    else {
      flush();
      out.push(row);
    }
  flush();
  return out;
};
