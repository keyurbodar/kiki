import { expect, it } from "vitest";
import { moveCorner } from "./desktop-pill-logic.ts";

it("moves a desktop pill with arrow keys and clamps at the edges", () => {
  expect(moveCorner("top-right", "ArrowLeft")).toBe("top-left");
  expect(moveCorner("top-left", "ArrowLeft")).toBeUndefined();
  expect(moveCorner("bottom-right", "ArrowUp")).toBe("top-right");
});
