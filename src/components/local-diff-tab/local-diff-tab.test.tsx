import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocalDiffTab, localDiffSummary } from "./local-diff-tab";

afterEach(cleanup);

describe("LocalDiffTab", () => {
  it("shows loading and empty states", () => {
    render(<LocalDiffTab pairKey="a:b" diff={undefined} />);
    expect(screen.getByRole("status", { name: "Loading diff" })).toBeTruthy();
    cleanup();
    render(<LocalDiffTab pairKey="a:b" diff={{ files: [] }} />);
    expect(screen.getByText("No changes in this pull request")).toBeTruthy();
  });

  it("summarises and collapses files", () => {
    expect(localDiffSummary(1, false)).toBe("1 file");
    expect(localDiffSummary(3, true)).toBe("3 files, more not shown");
    render(
      <LocalDiffTab
        pairKey="a:b"
        diff={{
          truncated: true,
          files: [
            {
              path: "src/a.ts",
              kind: "modified",
              patch: "@@ -1 +1 @@\n-old\n+new",
              additions: 1,
              deletions: 1,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("1 file, more not shown")).toBeTruthy();
    expect(screen.getByText("new")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByText("new")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Expand file" }));
    expect(screen.getByText("new")).toBeTruthy();
  });
});
