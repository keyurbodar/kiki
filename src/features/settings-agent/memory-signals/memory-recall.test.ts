import { describe, expect, it } from "vitest";
import { scopeCopy } from "./memory-recall.tsx";

describe("memory recall scope copy", () => {
  it("maps Capy's scopes to their labels", () => {
    expect(scopeCopy("project")).toBe("Shared · Project");
    expect(scopeCopy("project-user")).toBe("Personal · This project");
    expect(scopeCopy("personal")).toBe("Personal · Across projects");
    expect(scopeCopy(undefined)).toBe("Personal · Across projects");
  });
});
