import { describe, expect, it } from "vitest";
import {
  byPhase,
  inflect,
  shortenCommand,
  toolDescription,
  toolLabel,
} from "./tool-label";

const tool = (overrides: Record<string, unknown>) =>
  ({
    id: "t1",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: new Date(0),
    type: "activity",
    kind: "tool",
    turnOpen: false,
    turnCloses: false,
    toolName: "bash",
    args: {},
    phase: "done",
    ...overrides,
  }) as Parameters<typeof toolLabel>[0];

describe("inflect", () => {
  it("moves the leading verb to the phase's tense", () => {
    expect(inflect("Creating scratch folder", "done")).toBe(
      "Created scratch folder",
    );
    expect(inflect("Write first text file", "running")).toBe(
      "Writing first text file",
    );
    expect(inflect("Running tests", "failed")).toBe("Couldn't run tests");
    expect(inflect("Tidy the folder", "done")).toBe("Tidy the folder");
  });

  it("falls back to the past label when a failed verb is unknown", () => {
    expect(byPhase("failed", "Polishing", "Polished")).toBe("Polished");
  });
});

describe("toolLabel", () => {
  it("uses the description, capitalised and tensed", () => {
    expect(
      toolLabel(tool({ args: { description: "searching for the toggle" } })),
    ).toBe("Searched for the toggle");
  });

  it("ignores generic descriptions and falls back to the command", () => {
    expect(
      toolLabel(
        tool({
          args: { description: "Run command", command: "cd app && bun test" },
        }),
      ),
    ).toBe("bun test");
    expect(toolDescription("ls", "ls")).toBeUndefined();
  });

  it("labels execute scripts by phase", () => {
    expect(toolLabel(tool({ toolName: "execute", phase: "running" }))).toBe(
      "Running a script",
    );
    expect(toolLabel(tool({ toolName: "execute" }))).toBe("Ran a script");
  });

  it("truncates long commands", () => {
    expect(shortenCommand(`FOO=1 ${"x".repeat(60)}`)).toHaveLength(40);
  });
});

describe("toolLabel failures and execution", () => {
  const settled = (exitCode: number | undefined, isError = true) => ({
    blocks: [],
    isError,
    settledAt: new Date(1000),
    data: exitCode === undefined ? {} : { exit_code: exitCode },
  });

  it("reads a non-zero exit as what it was doing, then failed (exit N)", () => {
    const row = tool({
      phase: "failed",
      args: {
        command: "bun run test:checkout",
        description: "Running the checkout suite",
      },
      result: settled(2),
    });
    expect(toolLabel(row)).toBe("Run the checkout suite failed (exit 2)");
  });

  it("names the call when a failed command carried no description", () => {
    const row = tool({
      phase: "failed",
      args: { command: "bun run test:checkout" },
      result: settled(2),
    });
    expect(toolLabel(row)).toBe("Command failed (exit 2)");
  });

  it("keeps the Couldn't form when a failed call reported no exit code", () => {
    const row = tool({
      phase: "failed",
      args: { description: "Running the checkout suite" },
      result: settled(undefined),
    });
    expect(toolLabel(row)).toBe("Couldn't run the checkout suite");
  });

  it("marks a detached or background call the way Capy does", () => {
    const detached = tool({
      args: { command: "bun run dev", execution: "detached" },
    });
    expect(toolLabel(detached)).toBe("bun run dev (detached)");
    const background = tool({
      args: { command: "bun run build", execution: "background" },
    });
    expect(toolLabel(background)).toBe("bun run build (background)");
  });

  it("leaves a zero exit alone", () => {
    const row = tool({
      phase: "failed",
      args: { description: "Running the checkout suite" },
      result: settled(0),
    });
    expect(toolLabel(row)).toBe("Couldn't run the checkout suite");
  });
});

describe("end_turn", () => {
  it("names the step that closes a turn, as Capy does", () => {
    expect(toolLabel(tool({ toolName: "end_turn" }))).toBe("Ended the turn");
    expect(toolLabel(tool({ toolName: "end_turn", phase: "running" }))).toBe(
      "Ending the turn",
    );
  });
});

describe("file steps", () => {
  it("names the path a file tool touched", () => {
    expect(
      toolLabel(tool({ toolName: "read", args: { path: "a/b.sh" } })),
    ).toBe("Read a/b.sh");
    expect(
      toolLabel(tool({ toolName: "edit", args: { path: "a/b.ts" } })),
    ).toBe("Edited a/b.ts");
    expect(
      toolLabel(
        tool({ toolName: "write", args: { path: "a/c.ts" }, phase: "running" }),
      ),
    ).toBe("Writing a/c.ts");
  });

  it("keeps a description when the call carries one", () => {
    expect(
      toolLabel(
        tool({
          toolName: "read",
          args: { path: "a/b.sh", description: "Read the shard runner" },
        }),
      ),
    ).toBe("Read the shard runner");
  });
});
