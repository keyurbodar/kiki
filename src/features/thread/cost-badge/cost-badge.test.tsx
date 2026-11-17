import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { costRow, type UsageMember } from "./cost";
import { CostBadge } from "./cost-badge";

afterEach(cleanup);

const member = (
  jamId: string,
  totalCredits: number,
  keyCredits: number,
): UsageMember => ({
  jamId,
  familyId: jamId,
  usage: { totalCredits, vmCredits: 0 },
  keyCredits,
  models: [],
  images: [],
});

const rows = [
  costRow("jam_root", "This thread", [member("jam_root", 300, 100)]),
  costRow("jam_1", "Subagent 1", [member("jam_1", 100, 0)]),
];

describe("CostBadge", () => {
  it("renders the amount as a 28px tabular chip", () => {
    render(<CostBadge credits={120} />);
    const chip = screen.getByRole("button", { name: "Thread cost $0.12" });
    expect(chip.textContent).toBe("$0.12");
    expect(chip.className).toContain("h-(--h-control-sm)");
    expect(chip.className).toContain("text-xs");
    const value = chip.querySelector('[data-slot="cost-value"]');
    expect(value?.className).toContain("tabular-nums");
    expect(document.querySelector('[data-slot="cost-badge"]')).not.toBeNull();
  });

  it("shows an em dash until the amount is known", () => {
    render(<CostBadge />);
    const chip = screen.getByRole("button", { name: "Thread cost —" });
    expect(chip.textContent).toBe("—");
  });

  it("totals its rows and opens the breakdown card", async () => {
    render(<CostBadge rows={rows} />);
    const chip = screen.getByRole("button", { name: "Thread cost $0.50" });
    expect(chip.textContent).toBe("$0.50");
    fireEvent.click(chip);
    expect(await screen.findByText("Charged by Capy")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "This thread $0.30 $0.10" }),
    ).toBeTruthy();
  });
});
