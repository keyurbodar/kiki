import { describe, expect, it, vi } from "vitest";
import {
  createPaletteCommands,
  openTargetPath,
  viewForIntent,
} from "./command-palette-host";
import {
  buildSearchData,
  sampleSearchSource,
  threadIdFromPath,
} from "./search-source";

const actions = {
  go: () => undefined,
  compose: () => undefined,
  project: () => undefined,
  copyUrl: () => undefined,
};

describe("command palette host", () => {
  it("maps open intents to views", () => {
    expect(viewForIntent(null)).toEqual({ kind: "search" });
    expect(viewForIntent("compose")).toMatchObject({
      kind: "compose",
      from: "direct",
    });
    expect(viewForIntent("project")).toEqual({
      kind: "project",
      from: "direct",
    });
  });

  it("hands the command menu toggle to the dispatcher", () => {
    const toggle = vi.fn();
    const commands = createPaletteCommands({ toggle });
    commands["commandMenu.toggle"]?.(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("builds the paths rows open", () => {
    expect(
      openTargetPath({
        kind: "pull",
        pull: {
          id: "p",
          number: 4,
          title: "t",
          repo: "o/r",
          author: "a",
          state: "open",
          updatedAt: 0,
        },
      }),
    ).toBe("/pull/o/r/4");
    expect(
      openTargetPath({
        kind: "automation",
        automation: { id: "x", name: "n", enabled: true },
      }),
    ).toBe("/automation/x");
  });

  it("adds this thread's commands on a thread route", () => {
    expect(threadIdFromPath("/thread/thr-1/files")).toBe("thr-1");
    const source = sampleSearchSource(0);
    expect(
      buildSearchData(source, actions, "/thread/thr-1").currentThread?.thread
        .title,
    ).toBe("Add retry to the upload worker");
    expect(
      buildSearchData(source, actions, "/threads").currentThread,
    ).toBeUndefined();
  });

  it("feeds the Settings tab and the Settings group from the settings nav", () => {
    const data = buildSearchData(sampleSearchSource(0), actions, "/threads");
    expect(data.settings.length).toBeGreaterThan(0);
    expect(data.settingsSections.length).toBeGreaterThan(0);

    const threadsRow = data.settings.find(
      (command) => command.id === "settings-archive-idle-threads",
    );
    expect(threadsRow?.title).toBe("Archive idle threads");
    expect(threadsRow?.context).toBe("Threads");

    const pages = data.settingsSections.flatMap((section) => section.commands);
    expect(
      pages.some((command) => command.id === "settings-/settings/threads"),
    ).toBe(true);
    expect(
      data.settingsSections.every((section) =>
        section.commands.every((command) => command.kind === "setting"),
      ),
    ).toBe(true);
  });
});
