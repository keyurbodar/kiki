import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DriveDirectory, driveSummaryLabel } from "./drive-directory";

afterEach(cleanup);

describe("DriveDirectory", () => {
  it("shows the empty label when there are no drives", () => {
    render(<DriveDirectory entries={[]} />);
    expect(screen.getByText("Nothing in Capy Drive yet")).toBeTruthy();
  });

  it("summarizes a drive", () => {
    expect(
      driveSummaryLabel({
        fileCount: 1,
        totalBytes: 2048,
        headUpdatedAt: null,
      }),
    ).toBe("1 file, 2.0 KB");
    expect(
      driveSummaryLabel({ fileCount: 3, totalBytes: 10, headUpdatedAt: null }),
    ).toBe("3 files, 10 B");
  });
});
