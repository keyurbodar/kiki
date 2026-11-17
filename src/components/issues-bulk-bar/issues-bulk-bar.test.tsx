import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { IssueSummary } from "@/data/api/schemas/issue";
import { IssuesBulkBar } from "./issues-bulk-bar";

const issue = (code: string) => ({ id: code, code }) as unknown as IssueSummary;

describe("IssuesBulkBar", () => {
  it("shows the count, the four actions and clears the selection", () => {
    const onClear = vi.fn();
    render(
      <IssuesBulkBar
        checked={
          new Map([
            ["a", issue("ACME-1")],
            ["b", issue("ACME-2")],
          ])
        }
        onClear={onClear}
      />,
    );
    expect(screen.getByText("2 selected")).toBeTruthy();
    for (const label of ["Status", "Priority", "Assignee", "Notifications"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
