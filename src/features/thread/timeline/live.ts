import type { LiveDelta, LlmEvent } from "@/data/events";
import {
  CARD_TOOLS,
  COMPACTING_ID,
  HIDDEN_TOOLS,
  isDeliveryTool,
  isFinalSlackReact,
  LIVE_EVENT_ID,
  type LiveCall,
  type Row,
  readString,
  THINKING_STANDIN_ID,
  toolNamespace,
  unwrapToolCall,
} from "./shared";

type Part =
  | { readonly type: "text"; readonly id: string; readonly text: string }
  | { readonly type: "reasoning"; readonly id: string; readonly text: string }
  | {
      readonly type: "tool-input";
      readonly id: string;
      readonly name: string;
      readonly text: string;
    }
  | {
      readonly type: "tool-call";
      readonly id: string;
      readonly name: string;
      readonly input: unknown;
    };

/** The partial provider response of the open turn, in arrival order. */
export type LlmResponse = ReadonlyArray<Part>;

const reduceResponse = (parts: LlmResponse, event: LlmEvent): LlmResponse => {
  const append = (type: "text" | "reasoning", id: string, text: string) => {
    const index = parts.findIndex(
      (part) => part.type === type && part.id === id,
    );
    if (index === -1) return [...parts, { type, id, text }];
    const part = parts[index] as { text: string };
    return parts.with(index, { type, id, text: part.text + text });
  };
  switch (event.type) {
    case "text-start":
      return append("text", event.id, "");
    case "text-delta":
      return append("text", event.id, event.text);
    case "reasoning-start":
      return append("reasoning", event.id, "");
    case "reasoning-delta":
      return append("reasoning", event.id, event.text);
    case "tool-input-start":
      return parts.some((part) => part.id === event.id)
        ? parts
        : [
            ...parts,
            { type: "tool-input", id: event.id, name: event.name, text: "" },
          ];
    case "tool-input-delta":
      return parts.map((part) =>
        part.type === "tool-input" && part.id === event.id
          ? { ...part, text: part.text + event.text }
          : part,
      );
    case "tool-call": {
      const call: Part = {
        type: "tool-call",
        id: event.id,
        name: event.name,
        input: event.input,
      };
      const index = parts.findIndex((part) => part.id === event.id);
      return index === -1 ? [...parts, call] : parts.with(index, call);
    }
    default:
      return parts;
  }
};

/** Reads a string field out of a partial JSON object as it streams in. */
export const partialInputString = (
  partial: string,
  key: string,
): string | undefined => {
  try {
    const value = (JSON.parse(partial) as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  } catch {
    const match = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`).exec(
      partial,
    );
    if (match?.[1] === undefined) return undefined;
    const raw = match[1].endsWith("\\") ? match[1].slice(0, -1) : match[1];
    try {
      return JSON.parse(`"${raw}"`) as string;
    } catch {
      return raw;
    }
  }
};

export type LivePhase =
  | "idle"
  | "streaming"
  | "compacting"
  | "settled"
  | "aborted";

export interface LiveChild {
  readonly toolCallId: string;
  readonly calls: ReadonlyArray<LiveCall>;
}

/** Live state of the open turn, reduced from realtime deltas. Never stored. */
export interface LiveTurn {
  readonly phase: LivePhase;
  readonly response: LlmResponse;
  readonly children: ReadonlyMap<string, LiveChild>;
  readonly startedAt: Date;
  readonly blockStamps: ReadonlyMap<string, Date>;
  readonly reasoningEnds: ReadonlyMap<string, Date>;
  readonly formingArgs: ReadonlyMap<string, { readonly description: string }>;
}

export const idleLive: LiveTurn = {
  phase: "idle",
  response: [],
  children: new Map(),
  startedAt: new Date(0),
  blockStamps: new Map(),
  reasoningEnds: new Map(),
  formingArgs: new Map(),
};

type LiveBlock =
  | { readonly type: "text"; readonly id: string; readonly text: string }
  | { readonly type: "reasoning"; readonly id: string; readonly text: string }
  | {
      readonly type: "tool-forming";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly partialInput: string;
    }
  | {
      readonly type: "tool-call";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly input: unknown;
    };

const liveBlocks = (response: LlmResponse): ReadonlyArray<LiveBlock> =>
  response.flatMap((part, index): LiveBlock[] => {
    switch (part.type) {
      case "tool-input":
        return [
          {
            type: "tool-forming",
            toolCallId: part.id,
            toolName: part.name,
            partialInput: part.text,
          },
        ];
      case "text":
        return part.text.length === 0
          ? []
          : [{ type: "text", id: part.id || `part:${index}`, text: part.text }];
      case "reasoning":
        return [
          {
            type: "reasoning",
            id: part.id || `part:${index}`,
            text: part.text,
          },
        ];
      case "tool-call":
        return [
          {
            type: "tool-call",
            toolCallId: part.id,
            toolName: part.name,
            input: part.input,
          },
        ];
      default:
        return [];
    }
  });

const blockKey = (block: LiveBlock) =>
  block.type === "text" || block.type === "reasoning"
    ? block.id
    : block.toolCallId;

const mergeChild = (
  previous: LiveChild | undefined,
  next: LiveChild,
): LiveChild => {
  if (previous === undefined) return next;
  const calls = new Map(previous.calls.map((call) => [call.index, call]));
  for (const call of next.calls) calls.set(call.index, call);
  return {
    ...next,
    calls: [...calls.values()].toSorted((a, b) => a.index - b.index),
  };
};

/**
 * One realtime delta applied to the live turn: Capy's live reducer plus the
 * per-block arrival stamps it keeps for line timing.
 */
export const applyDelta = (
  live: LiveTurn,
  delta: LiveDelta,
  now: Date,
): LiveTurn => {
  switch (delta.type) {
    case "turn-start":
      return {
        ...idleLive,
        phase: "streaming",
        children: live.children,
        startedAt: now,
      };
    case "tool-activity": {
      const children = new Map(live.children).set(
        delta.toolCallId,
        mergeChild(live.children.get(delta.toolCallId), {
          toolCallId: delta.toolCallId,
          calls: delta.calls,
        }),
      );
      return { ...live, children };
    }
    case "compaction-start":
      return { ...stamped(live, now), phase: "compacting", response: [] };
    case "turn-end":
      return delta.outcome === "aborted"
        ? { ...idleLive, children: live.children }
        : { ...live, phase: "settled" };
    case "llm-event": {
      const base = stamped(live, now);
      const response = reduceResponse(
        base.phase === "streaming" ? base.response : [],
        delta.event,
      );
      const blocks = liveBlocks(response);
      const blockStamps = new Map(base.blockStamps);
      for (const block of blocks)
        if (!blockStamps.has(blockKey(block)))
          blockStamps.set(blockKey(block), now);
      const reasoningEnds =
        delta.event.type === "reasoning-end"
          ? new Map(base.reasoningEnds).set(delta.event.id, now)
          : base.reasoningEnds;
      const formingArgs = new Map(base.formingArgs);
      for (const block of blocks) {
        if (block.type !== "tool-forming") continue;
        const description = partialInputString(
          block.partialInput,
          "description",
        );
        if (description !== undefined && description.trim().length > 0)
          formingArgs.set(block.toolCallId, { description });
      }
      return {
        ...base,
        phase: "streaming",
        response,
        blockStamps,
        reasoningEnds,
        formingArgs,
      };
    }
    default:
      return live;
  }
};

const stamped = (live: LiveTurn, now: Date): LiveTurn =>
  live.startedAt.getTime() === 0 && live.phase === "idle"
    ? { ...live, startedAt: now }
    : live;

/** Tool calls the live turn emitted, so the feed can drop it once they are stored. */
export const liveToolCallIds = (live: LiveTurn) =>
  liveBlocks(live.response).flatMap((block) =>
    block.type === "tool-call" ? [block.toolCallId] : [],
  );

const deliveryOf = (block: LiveBlock | undefined) => {
  if (block?.type === "tool-call") {
    const call = unwrapToolCall(block.toolName, block.input);
    return isDeliveryTool(call.toolName, call.args)
      ? readString(call.args, "state")
      : undefined;
  }
  if (
    block?.type === "tool-forming" &&
    isDeliveryTool(block.toolName, {
      to: partialInputString(block.partialInput, "to"),
    })
  )
    return partialInputString(block.partialInput, "state");
  return undefined;
};

const endsTurn = (block: LiveBlock | undefined) => {
  if (block === undefined) return false;
  if (block.type === "tool-call") {
    const call = unwrapToolCall(block.toolName, block.input);
    if (
      call.toolName === "end_turn" ||
      isFinalSlackReact(call.toolName, call.args)
    )
      return true;
  }
  const state = deliveryOf(block);
  return state === "final" || state === "needs_you";
};

const standin = (createdAt: Date, writing?: boolean): Row => ({
  eventId: LIVE_EVENT_ID,
  createdAt,
  startedAt: createdAt,
  turnOpen: true,
  turnCloses: false,
  type: "activity",
  kind: "reasoning",
  id: THINKING_STANDIN_ID,
  text: "",
  presentation: "summary",
  elapsedMs: 0,
  writing,
});

const liveMessage = (
  id: string,
  text: string,
  at: Date,
  turnCloses: boolean,
  uploads: ReadonlyArray<unknown> = [],
  placing: ReadonlyArray<unknown> = [],
): Row => ({
  type: "agent-message",
  id,
  eventId: LIVE_EVENT_ID,
  createdAt: at,
  startedAt: at,
  settled: false,
  interrupted: false,
  turnCloses,
  text,
  files: [],
  uploads,
  placed: [],
  placing,
  modelId: "",
});

/** Rows for the live turn: streaming text and reasoning, forming tools, a standin. */
export const liveEntries = (live: LiveTurn): ReadonlyArray<Row> => {
  const rows = streamingRows(live);
  return live.children.size === 0
    ? rows
    : [
        ...rows,
        ...[...live.children.values()].map(
          (child): Row => ({
            type: "activity",
            kind: "tool",
            id: child.toolCallId,
            eventId: LIVE_EVENT_ID,
            createdAt: live.startedAt,
            turnOpen: false,
            turnCloses: false,
            toolName: "execute",
            args: {},
            phase: "running",
            result: undefined,
            liveCalls: child.calls,
          }),
        ),
      ];
};

const streamingRows = (live: LiveTurn): ReadonlyArray<Row> => {
  if (live.phase === "idle") return [];
  if (live.phase === "compacting")
    return [
      {
        eventId: LIVE_EVENT_ID,
        createdAt: live.startedAt,
        type: "marker",
        kind: "compaction",
        id: COMPACTING_ID,
        label: "Compacting the conversation",
        live: true,
      },
    ];
  const blocks = liveBlocks(live.response);
  if (live.phase === "streaming" && blocks.length === 0)
    return [standin(live.startedAt)];
  const closing = endsTurn(blocks.at(-1));
  const rows: Row[] = [];
  let dropped = false;
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block === undefined) continue;
    const before = rows.length;
    const base = {
      eventId: LIVE_EVENT_ID,
      createdAt: live.startedAt,
      startedAt: live.startedAt,
      turnOpen: !closing,
      turnCloses: false,
    };
    switch (block.type) {
      case "text":
        rows.push({
          ...base,
          type: "activity",
          kind: "text",
          id: block.id,
          text: block.text,
        });
        break;
      case "reasoning": {
        const id = block.id;
        const texts = [block.text];
        while (blocks[index + 1]?.type === "reasoning") {
          index += 1;
          const next = blocks[index];
          if (next?.type === "reasoning") texts.push(next.text);
        }
        const lastBlock = blocks[index];
        const endId = lastBlock?.type === "reasoning" ? lastBlock.id : id;
        const ended = live.reasoningEnds.get(endId);
        const isLast = index === blocks.length - 1;
        const first = blocks[0];
        const createdAt =
          rows.length === 0 && first !== undefined && blockKey(first) === id
            ? live.startedAt
            : (live.blockStamps.get(id) ?? live.startedAt);
        const after = blocks[index + 1];
        const endedAt =
          ended ??
          (after === undefined
            ? undefined
            : live.blockStamps.get(blockKey(after)));
        rows.push({
          ...base,
          turnOpen: isLast,
          createdAt,
          type: "activity",
          kind: "reasoning",
          id,
          text: texts.filter((text) => text.length > 0).join("\n\n"),
          presentation: "displayed",
          elapsedMs:
            isLast || endedAt === undefined
              ? 0
              : Math.max(0, endedAt.getTime() - createdAt.getTime()),
        });
        break;
      }
      case "tool-call": {
        const { toolName, args } = unwrapToolCall(block.toolName, block.input);
        if (CARD_TOOLS.has(toolName) || HIDDEN_TOOLS.has(toolName)) break;
        if (isDeliveryTool(toolName, args)) {
          const text = readString(args, "text");
          if (text !== undefined)
            rows.push(
              liveMessage(
                block.toolCallId,
                text,
                live.startedAt,
                closing && index === blocks.length - 1,
              ),
            );
          break;
        }
        rows.push({
          ...base,
          createdAt: live.blockStamps.get(block.toolCallId) ?? live.startedAt,
          type: "activity",
          kind: "tool",
          id: block.toolCallId,
          toolName,
          namespace: toolNamespace(toolName),
          args,
          phase: "running",
          result: undefined,
        });
        break;
      }
      case "tool-forming": {
        if (CARD_TOOLS.has(block.toolName) || HIDDEN_TOOLS.has(block.toolName))
          break;
        if (
          isDeliveryTool(block.toolName, {
            to: partialInputString(block.partialInput, "to"),
          })
        ) {
          const text = partialInputString(block.partialInput, "text");
          if (text !== undefined && text.trim().length > 0)
            rows.push(
              liveMessage(
                block.toolCallId,
                text,
                live.startedAt,
                closing && index === blocks.length - 1,
              ),
            );
          break;
        }
        rows.push({
          ...base,
          createdAt: live.blockStamps.get(block.toolCallId) ?? live.startedAt,
          type: "activity",
          kind: "tool",
          id: block.toolCallId,
          toolName: block.toolName,
          namespace: toolNamespace(block.toolName),
          args: live.formingArgs.get(block.toolCallId) ?? {},
          phase: "forming",
          result: undefined,
        });
        break;
      }
    }
    dropped = rows.length === before;
  }
  const last = blocks.at(-1);
  if (dropped && !closing && last !== undefined)
    return [
      ...rows,
      standin(
        rows.length === 0
          ? live.startedAt
          : (live.blockStamps.get(blockKey(last)) ?? live.startedAt),
        true,
      ),
    ];
  if (rows.length === 0 && !closing) return [standin(live.startedAt)];
  if (rows.at(-1)?.type === "agent-message" && deliveryOf(last) === "working")
    return [...rows, standin(live.startedAt)];
  return rows;
};
