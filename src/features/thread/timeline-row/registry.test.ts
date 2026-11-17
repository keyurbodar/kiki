import { expect, it } from "vitest";
import { collectTimelineRows, defineTimelineRow } from "./registry";

const Empty = () => null;

it("indexes renderers by row type", () => {
  const rows = collectTimelineRows([
    defineTimelineRow({ type: "marker", component: Empty }),
    defineTimelineRow({ type: "error", component: Empty }),
  ]);
  expect([...rows.keys()]).toEqual(["marker", "error"]);
});

it("rejects two renderers for one row type", () => {
  expect(() =>
    collectTimelineRows([
      defineTimelineRow({ type: "marker", component: Empty }),
      defineTimelineRow({ type: "marker", component: Empty }),
    ]),
  ).toThrow(/marker/);
});
