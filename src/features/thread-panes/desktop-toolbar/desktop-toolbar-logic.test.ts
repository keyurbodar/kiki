import { expect, it } from "vitest";
import { inputTypeToKey, nextLatchedKeys } from "./desktop-toolbar-logic.ts";

it("maps composition input types to desktop keys", () => {
  expect(inputTypeToKey("deleteContentBackward")).toBe("Backspace");
  expect(inputTypeToKey("insertParagraph")).toBe("Enter");
  expect(inputTypeToKey("insertText")).toBeUndefined();
});

it("latches and releases modifier keys without duplicates", () => {
  const latched = nextLatchedKeys([], "ShiftLeft", true);
  expect(nextLatchedKeys(latched, "ShiftLeft", true)).toEqual(["ShiftLeft"]);
  expect(nextLatchedKeys(latched, "ShiftLeft", false)).toEqual([]);
});
