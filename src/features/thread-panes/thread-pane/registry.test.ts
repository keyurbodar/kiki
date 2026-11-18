import { describe, expect, it } from "vitest";
import {
  collectPanes,
  definePane,
  keepsPaneParam,
  writesPaneParam,
} from "./registry";

const Empty = () => null;
const pane = (id: string, order: number) =>
  definePane({ id, label: id, order, component: Empty });

it("orders panes by order, then id", () => {
  expect(
    collectPanes([pane("b", 1), pane("a", 1), pane("z", 0)]).map((p) => p.id),
  ).toEqual(["z", "a", "b"]);
});

it("rejects duplicate pane ids", () => {
  expect(() => collectPanes([pane("a", 0), pane("a", 1)])).toThrow(/"a"/);
});

describe("keeping a pane param and writing one are different questions", () => {
  it("writes only Capy's own pane vocabulary", () => {
    for (const value of ["overview", "diffs", "captain_issues", "setup"]) {
      expect(writesPaneParam(value)).toBe(true);
    }
    for (const value of [
      "files",
      "browser:machine_01:tab_02",
      "service-preview:machine_01:3000",
      "terminal",
      undefined,
    ]) {
      expect(writesPaneParam(value)).toBe(false);
    }
  });

  it("keeps a parameterised key it cannot write, so a reload does not lose the tab", () => {
    for (const value of [
      "browser:machine_01:tab_02",
      "service-preview:machine_01:3000",
    ]) {
      expect(keepsPaneParam(value)).toBe(true);
      expect(writesPaneParam(value)).toBe(false);
    }
  });

  it("drops a value neither kept nor written", () => {
    expect(keepsPaneParam("not-a-pane")).toBe(false);
  });
});
