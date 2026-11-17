import { describe, expect, it } from "vitest";
import {
  isPaletteToggle,
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

  it("toggles on Cmd or Ctrl+K only", () => {
    const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);
    expect(isPaletteToggle(key({ key: "k", metaKey: true }))).toBe(true);
    expect(isPaletteToggle(key({ key: "K", ctrlKey: true }))).toBe(true);
    expect(isPaletteToggle(key({ key: "k" }))).toBe(false);
    expect(
      isPaletteToggle(key({ key: "k", metaKey: true, shiftKey: true })),
    ).toBe(false);
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
});
