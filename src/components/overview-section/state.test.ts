import { describe, expect, it } from "vitest";
import {
  hiddenRowCount,
  moreLabel,
  OVERVIEW_SECTION_LIMIT,
  toggleSection,
  visibleRows,
} from "./state";

describe("overview section", () => {
  it("limits rows until expanded", () => {
    const rows = Array.from({ length: 14 }, (_, index) => index);
    expect(hiddenRowCount(rows.length, false)).toBe(4);
    expect(hiddenRowCount(rows.length, true)).toBe(0);
    expect(visibleRows(rows, false)).toHaveLength(OVERVIEW_SECTION_LIMIT);
    expect(visibleRows(rows, true)).toHaveLength(14);
  });

  it("toggles a section id without duplicates", () => {
    expect(toggleSection([], "pulls", true)).toEqual(["pulls"]);
    expect(toggleSection(["pulls"], "pulls", true)).toEqual(["pulls"]);
    expect(toggleSection(["pulls"], "pulls", false)).toEqual([]);
  });

  it("picks the more label by load state", () => {
    const base = { loading: false, retry: false, onLoad: () => undefined };
    expect(moreLabel(base)).toBe("Show more");
    expect(moreLabel({ ...base, retry: true })).toBe("Retry");
    expect(moreLabel({ ...base, loading: true })).toBe("Loading…");
  });
});
