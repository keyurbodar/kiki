import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CaptainOverview } from "./captain-overview";

const now = new Date(2026, 10, 17, 12).getTime();

describe("CaptainOverview", () => {
  it("lists needs-you and in-progress issues and opens them by code", () => {
    const open = vi.fn();
    render(
      <CaptainOverview
        now={now}
        onOpenIssue={open}
        needsYou={[
          {
            id: "iss_1",
            code: "ACME-22",
            title: "Ship the release notes",
            unread: true,
            updatedAt: new Date(now - 864e5),
            assignee: { name: "Alex Morgan" },
          },
        ]}
        inProgress={[]}
      />,
    );
    expect(screen.getByText("Needs you")).toBeTruthy();
    expect(screen.queryByText("In progress")).toBeNull();
    expect(screen.getByText("for")).toBeTruthy();
    expect(screen.getByText("1d")).toBeTruthy();
    fireEvent.click(screen.getByText("Ship the release notes"));
    expect(open).toHaveBeenCalledWith("ACME-22", false);
    fireEvent.click(screen.getByText("Needs you"));
    expect(screen.queryByText("Ship the release notes")).toBeNull();
  });
});
