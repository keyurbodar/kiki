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
    expect(shortenCommand("FOO=1 " + "x".repeat(60))).toHaveLength(40);
  });
});
