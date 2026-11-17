import { expect, it } from "vitest";
import { searchParams } from "./search-params";

it("keeps only the declared keys as strings", () => {
  const validate = searchParams(["pane", "pr"]);
  expect(validate({ pane: "files", pr: 12, other: "x" })).toEqual({
    pane: "files",
    pr: "12",
  });
});

it("drops missing and null values", () => {
  expect(searchParams(["pane"])({ pane: null })).toEqual({});
});
