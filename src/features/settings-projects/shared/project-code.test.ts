import { describe, expect, it } from "vitest";
import { deriveProjectCode } from "./project-code";

describe("deriveProjectCode", () => {
  it("keeps the first four letters of the repository name", () => {
    expect(deriveProjectCode("web-app")).toBe("WEBA");
    expect(deriveProjectCode("site")).toBe("SITE");
    expect(deriveProjectCode("api")).toBe("API");
  });

  it("falls back to CAPY when the name has too few letters", () => {
    expect(deriveProjectCode("ab")).toBe("CAPY");
    expect(deriveProjectCode("42")).toBe("CAPY");
  });
});
