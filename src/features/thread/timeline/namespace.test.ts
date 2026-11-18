import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityRow, EventRow, type TimelineRow } from "@/data/events";
import { buildTimeline } from "./build";
import { toolNamespace } from "./shared";

const decodeEvent = Schema.decodeUnknownSync(EventRow);

const id = (suffix: string) => `01JA070000000000000000${suffix}`;

const assistant = (suffix: string, blocks: ReadonlyArray<unknown>): EventRow =>
  decodeEvent({
    id: id(suffix),
    jamId: "jam_namespace",
    kind: "assistant",
    state: "answered",
    createdAt: "2026-11-18T09:00:00.000Z",
    payload: {
      actor: { type: "agent", jamId: "jam_namespace" },
      origin: { type: "web" },
      model: {
        modelId: "anthropic/claude-sample",
        providerModelId: "claude-sample",
      },
      route: { source: "capy", providerId: "anthropic" },
      usage: {
        inputTokens: 10,
        outputTokens: 10,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
      contextTokens: {
        system: 0,
        tools: 0,
        rules: 0,
        skills: 0,
        mcp: 0,
        environment: 0,
      },
      stopReason: "tool_use",
      blocks,
    },
  });

/** A call the proxy dispatches to a named tool, which is how Capy sends MCP calls. */
const proxied = (toolCallId: string, name: string, args: object) => ({
  id: `blk_${toolCallId}`,
  type: "tool_use",
  toolCallId,
  toolName: "tool_call",
  args: { name, args },
});

const plain = (toolCallId: string, toolName: string, args: object) => ({
  id: `blk_${toolCallId}`,
  type: "tool_use",
  toolCallId,
  toolName,
  args,
});

type ToolRow = Extract<TimelineRow, { kind: "tool" }>;

/** Tool rows however the timeline grouped them: a cluster or work group holds them as members. */
const tools = (rows: ReadonlyArray<TimelineRow>): ToolRow[] =>
  rows.flatMap((row): ToolRow[] => {
    if (row.type === "activity") return row.kind === "tool" ? [row] : [];
    if (row.type === "work-group")
      return tools(row.entries as ReadonlyArray<TimelineRow>);
    if (row.type === "cluster")
      return tools(row.members as ReadonlyArray<TimelineRow>);
    return [];
  });

const toolRows = (events: ReadonlyArray<EventRow>) =>
  tools(
    buildTimeline(events, {
      liveEntries: [],
      liveSettled: false,
      expandedGroupIds: new Map(),
    }).rows,
  );

describe("toolNamespace", () => {
  it("reads the server from Capy's <namespace>__<tool> names", () => {
    expect(toolNamespace("automation__create")).toBe("automation");
    expect(toolNamespace("linear__list_issues")).toBe("linear");
    expect(toolNamespace("executor__execute")).toBe("executor");
  });

  it("leaves built-in names without one", () => {
    expect(toolNamespace("bash")).toBeUndefined();
    expect(toolNamespace("create")).toBeUndefined();
  });

  it("ignores a separator that does not name a server", () => {
    expect(toolNamespace("__create")).toBeUndefined();
  });
});

describe("a tool row's namespace", () => {
  const rows = toolRows([
    assistant("000A", [
      proxied("create_auto", "automation__create", {
        name: "Nightly dependency check",
      }),
      proxied("create_other", "create", { title: "something else" }),
      plain("bash_row", "bash", { command: "ls" }),
    ]),
  ]);

  it("distinguishes an automation create from a plain create", () => {
    const automation = rows.find((row) => row.id === "create_auto");
    const other = rows.find((row) => row.id === "create_other");
    expect(automation?.toolName).toBe("automation__create");
    expect(automation?.namespace).toBe("automation");
    expect(other?.toolName).toBe("create");
    expect(other?.namespace).toBeUndefined();
  });

  it("leaves a built-in call without a namespace", () => {
    expect(
      rows.find((row) => row.id === "bash_row")?.namespace,
    ).toBeUndefined();
  });

  it("keeps the call's own arguments, so the name the label needs is there", () => {
    const automation = rows.find((row) => row.id === "create_auto");
    expect(automation?.args).toEqual({ name: "Nightly dependency check" });
  });

  it("decodes a row written before the field existed", () => {
    const decoded = Schema.decodeUnknownSync(ActivityRow)({
      type: "activity",
      kind: "tool",
      id: "legacy",
      eventId: id("000A"),
      createdAt: "2026-11-18T09:00:00.000Z",
      turnOpen: false,
      turnCloses: false,
      toolName: "create",
      args: {},
      phase: "done",
    });
    expect(
      decoded.kind === "tool" ? decoded.namespace : "missing",
    ).toBeUndefined();
  });
});
