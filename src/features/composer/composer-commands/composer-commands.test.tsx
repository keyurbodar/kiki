import { describe, expect, it, vi } from "vitest";
import {
  composerCommandCapabilities,
  composerCommands,
} from "./composer-commands";

describe("composer commands", () => {
  it("lists Capy's commands in Capy's order", () => {
    expect(composerCommandCapabilities.map((c) => c.name)).toEqual([
      "plan",
      "new",
      "compact",
      "fork",
      "fork-summary",
    ]);
    expect(composerCommandCapabilities.map((c) => c.label)).toEqual([
      "Plan mode",
      "New thread",
      "Compact",
      "Fork with full context",
      "Fork with summary",
    ]);
  });

  it("lists only the rows the surface can run", () => {
    const thread = composerCommands({
      newThread: () => undefined,
      compact: () => undefined,
      fork: () => undefined,
    });
    expect(thread.map((c) => [c.name, c.label, c.kind])).toEqual([
      ["plan", "Plan mode", "insert"],
      ["new", "New thread", "action"],
      ["compact", "Compact", "action"],
      ["fork", "Fork with full context", "action"],
      ["fork-summary", "Fork with summary", "action"],
    ]);

    const bare = composerCommands({ newThread: () => undefined });
    expect(bare.map((c) => c.name)).toEqual(["plan", "new"]);
  });

  it("types plan mode into the composer rather than running it", () => {
    const [plan] = composerCommands({ newThread: () => undefined });
    if (plan?.kind !== "insert") throw new Error("expected an insert row");
    expect(plan.text).toBe("/plan ");
  });

  it("runs the handler the surface passed for the command", () => {
    const newThread = vi.fn();
    const compact = vi.fn();
    const commands = composerCommands({ newThread, compact });
    const row = commands.find((command) => command.name === "compact");
    if (row?.kind !== "action") throw new Error("expected an action row");
    row.run();
    expect(compact).toHaveBeenCalledTimes(1);
    const newRow = commands.find((command) => command.name === "new");
    if (newRow?.kind !== "action") throw new Error("expected an action row");
    newRow.run();
    expect(newThread).toHaveBeenCalledTimes(1);
  });

  it("forks with the mode each row names", () => {
    const fork = vi.fn();
    const commands = composerCommands({ newThread: () => undefined, fork });
    for (const name of ["fork", "fork-summary"]) {
      const row = commands.find((command) => command.name === name);
      if (row?.kind !== "action") throw new Error("expected an action row");
      row.run();
    }
    expect(fork.mock.calls).toEqual([["copy"], ["summary"]]);
  });

  it("carries a sprite icon rather than a missing id", () => {
    for (const command of composerCommands({ newThread: () => undefined }))
      expect(command.icon).toBeTruthy();
  });
});
