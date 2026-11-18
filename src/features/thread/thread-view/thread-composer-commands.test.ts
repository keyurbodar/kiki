import { describe, expect, it, vi } from "vitest";
import { threadComposerCommands } from "./thread-composer-commands";

describe("thread composer commands", () => {
  it("lists Capy's New thread row and nothing kiki cannot run", () => {
    const commands = threadComposerCommands(() => undefined);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({
      name: "new",
      label: "New thread",
      kind: "action",
    });
  });

  it("runs the command it lists", () => {
    const go = vi.fn();
    const [command] = threadComposerCommands(go);
    if (command?.kind !== "action") throw new Error("expected an action");
    command.run();
    expect(go).toHaveBeenCalledTimes(1);
  });
});
