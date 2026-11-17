import { describe, expect, it } from "vitest";
import {
  checkNewFile,
  isValidSegment,
  joinPath,
  pathCollisions,
} from "./paths";

describe("joinPath", () => {
  it("joins a directory and a name", () => {
    expect(joinPath("", "a.md")).toBe("a.md");
    expect(joinPath("docs", "a.md")).toBe("docs/a.md");
  });
});

describe("pathCollisions", () => {
  const existing = new Set(["docs/a.md", "notes", "src/app.ts"]);

  it("finds exact matches, children and ancestors", () => {
    expect(pathCollisions(existing, "docs/a.md")).toEqual(["docs/a.md"]);
    expect(pathCollisions(existing, "docs")).toEqual(["docs/a.md"]);
    expect(pathCollisions(existing, "notes/b.md")).toEqual(["notes"]);
  });

  it("ignores shared prefixes that are not path segments", () => {
    expect(pathCollisions(existing, "doc")).toEqual([]);
    expect(pathCollisions(existing, "src/app.tsx")).toEqual([]);
  });
});

describe("isValidSegment", () => {
  it("rejects empty and dot segments", () => {
    expect(isValidSegment("a")).toBe(true);
    expect(isValidSegment("")).toBe(false);
    expect(isValidSegment(".")).toBe(false);
    expect(isValidSegment("..")).toBe(false);
  });
});

describe("checkNewFile", () => {
  const existing = new Set(["docs/a.md"]);

  it("trims input and strips leading slashes", () => {
    expect(checkNewFile("docs", existing, "  /b.md ")).toEqual({
      path: "docs/b.md",
      collides: false,
      valid: true,
    });
  });

  it("flags collisions and invalid segments", () => {
    expect(checkNewFile("docs", existing, "a.md")).toMatchObject({
      collides: true,
      valid: false,
    });
    expect(checkNewFile("", existing, "a//b.md").valid).toBe(false);
    expect(checkNewFile("", existing, "../b.md").valid).toBe(false);
    expect(checkNewFile("", existing, "   ")).toEqual({
      path: "",
      collides: false,
      valid: false,
    });
  });
});
