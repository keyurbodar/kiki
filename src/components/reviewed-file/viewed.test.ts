import { describe, expect, it } from "vitest";
import { normalizeViewedFiles, settlePending, viewedPathsFor } from "./viewed";

describe("viewed files", () => {
  it("reads both the row list and the Capy shape", () => {
    expect([
      ...normalizeViewedFiles([
        { path: "a", viewed: true },
        { path: "b", viewed: false },
      ]).paths,
    ]).toEqual(["a"]);
    const capy = normalizeViewedFiles({ headSha: "h", paths: ["x", 3] });
    expect([...capy.paths]).toEqual(["x"]);
    expect(viewedPathsFor(capy, "h")?.has("x")).toBe(true);
    expect(viewedPathsFor(capy, "other")).toBeNull();
  });

  it("settles an optimistic value once the server agrees or the write lands", () => {
    const pending = { id: 1, value: true, written: false };
    expect(settlePending(pending, false, false)).toBe(pending);
    expect(settlePending(pending, true, false)).toBeNull();
    expect(
      settlePending({ ...pending, written: true }, false, true),
    ).not.toBeNull();
    expect(
      settlePending({ ...pending, written: true }, false, false),
    ).toBeNull();
    expect(settlePending(null, true, false)).toBeNull();
  });
});
