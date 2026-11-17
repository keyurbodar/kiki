import { expect, it } from "vitest";
import { collectPanes, definePane } from "./registry";

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
