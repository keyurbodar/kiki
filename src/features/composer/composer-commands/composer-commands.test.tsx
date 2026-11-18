import { describe, expect, it, vi } from "vitest";
import {
  composerCommandCapabilities,
  composerCommands,
} from "./composer-commands";

describe("composer commands", () => {
  it("lists Capy's commands in Capy's order", () => {
    expect(composerCommandCapabilities.map((c) => c.name)).toEqual(["new"]);
    expect(composerCommandCapabilities.map((c) => c.label)).toEqual([
      "New thread",
    ]);
  });

  it("lists only the rows the surface can run", () => {
    const thread = composerCommands({ newThread: () => undefined });
    expect(thread.map((c) => [c.name, c.label, c.kind])).toEqual([
      ["new", "New thread", "action"],
    ]);

    const home = composerCommands({ newThread: () => undefined });
    expect(home.map((c) => c.name)).toEqual(["new"]);
  });

  it("runs the handler the surface passed for the command", () => {
    const newThread = vi.fn();
    const [command] = composerCommands({ newThread });
    if (command?.kind !== "action") throw new Error("expected an action row");
    command.run();
    expect(newThread).toHaveBeenCalledTimes(1);
  });

  it("carries a sprite icon rather than a missing id", () => {
    const [command] = composerCommands({ newThread: () => undefined });
    expect(command?.icon).toBeTruthy();
  });
});
