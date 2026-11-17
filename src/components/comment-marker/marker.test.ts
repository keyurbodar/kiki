import { describe, expect, it } from "vitest";
import { markerLabel, markerTone } from "./marker";

describe("comment markers", () => {
  it("labels findings and comments", () => {
    const finding = {
      kind: "issue" as const,
      severity: null,
      confidence: "investigate" as const,
      summary: "Check it",
    };
    expect(markerLabel({ id: "1", finding })).toBe(
      "Capy medium, investigate: Check it",
    );
    expect(
      markerLabel({
        id: "2",
        finding: { ...finding, kind: "note", confidence: null },
      }),
    ).toBe("Capy note: Check it");
    expect(markerLabel({ id: "3" })).toBe("Comment by GitHub user");
    expect(markerLabel({ id: "4", author: { name: "Alex Morgan" } })).toBe(
      "Comment by Alex Morgan",
    );
    expect(
      markerTone({ id: "5", finding: { ...finding, severity: "high" } }),
    ).toBe("high");
    expect(markerTone({ id: "6" })).toBeUndefined();
  });
});
