import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { costRow, type UsageMember } from "./cost";
import { CostBreakdown } from "./cost-breakdown";

afterEach(cleanup);

const member = (
  jamId: string,
  vmCredits: number,
  label: string,
): UsageMember => ({
  jamId,
  familyId: jamId,
  usage: { totalCredits: 300, vmCredits },
  keyCredits: 100,
  models: [
    {
      entryId: jamId,
      label,
      unbilled: false,
      credentialName: null,
      credits: 300,
      tokenFeeCredits: 0,
    },
  ],
  images: [],
});

const rows = [
  costRow("jam_root", "This thread", [member("jam_root", 120, "Acme model")]),
  costRow("jam_1", "Subagent 1", [member("jam_1", 30, "Acme image")]),
];

describe("CostBreakdown", () => {
  it("shows summed totals and the two thread rows", () => {
    render(<CostBreakdown rows={rows} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("$0.60")).toBeTruthy();
    expect(screen.getByText("Charged by Capy")).toBeTruthy();
    expect(screen.getByText("$0.20")).toBeTruthy();
    expect(screen.getByText("On your keys")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "This thread $0.30 $0.10" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Subagent 1 $0.30 $0.10" }),
    ).toBeTruthy();
  });

  it("switches to resources and back", () => {
    render(<CostBreakdown rows={rows} selected={null} onSelect={vi.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Models and machines" }),
    );
    expect(screen.getByText("Machines")).toBeTruthy();
    expect(screen.getByText("Acme model")).toBeTruthy();
    expect(screen.getByText("Acme image")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "By thread" }));
    expect(
      screen.getByRole("button", { name: "This thread $0.30 $0.10" }),
    ).toBeTruthy();
  });

  it("selects a row and returns to the list with the back button", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <CostBreakdown rows={rows} selected={null} onSelect={onSelect} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Subagent 1 $0.30 $0.10" }),
    );
    expect(onSelect).toHaveBeenCalledWith("jam_1");
    rerender(
      <CostBreakdown rows={rows} selected="jam_1" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Subagent 1" }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
