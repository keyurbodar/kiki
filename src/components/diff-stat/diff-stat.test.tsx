import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiffStat, visibleDiffTotals } from "./diff-stat";

const breakdown = {
  database: { files: 1, additions: 10, deletions: 2 },
  tests: { files: 2, additions: 30, deletions: 0 },
  generated: { files: 0, additions: 0, deletions: 0 },
};

describe("visibleDiffTotals", () => {
  it("subtracts only hidden categories", () => {
    expect(
      visibleDiffTotals(100, 20, breakdown, {
        database: true,
        tests: false,
        generated: false,
      }),
    ).toEqual({ additions: 90, deletions: 18 });
    expect(
      visibleDiffTotals(100, 20, breakdown, {
        database: false,
        tests: false,
        generated: false,
      }),
    ).toEqual({ additions: 100, deletions: 20 });
  });
});

describe("DiffStat", () => {
  it("renders plain counts without a breakdown", () => {
    render(<DiffStat additions={12} deletions={3} />);
    expect(screen.getByText("+12")).toBeTruthy();
    expect(screen.getByText("-3")).toBeTruthy();
  });
});
