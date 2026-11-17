import { expect, it } from "vitest";
import { paperEmbedUrl, paperError } from "./paper-view-logic.ts";

it("builds a minimal Paper embed URL with an optional page", () => {
  expect(paperEmbedUrl("file/1", "https://app.paper.design", "p 2")).toBe(
    "https://app.paper.design/embed/file%2F1?minimal&page=p%202",
  );
});

it("classifies Paper failures", () => {
  expect(paperError(new Error("not_connected"))).toBe("not_connected");
  expect(paperError(new Error("embed failed"))).toBe("unavailable");
  expect(paperError(undefined)).toBeUndefined();
});
