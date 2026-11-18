import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { costRow, type UsageMember } from "./cost";
import { CostBadge } from "./cost-badge";
import { ThreadCostBadgeControl } from "./thread-cost-badge";

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

/**
 * The amount a reader sees and a screen reader announces, once: the chip's text
 * is drawn per character (torph morphs a changed amount instead of replacing
 * it), so the readable copy is the element torph marks as its accessible text.
 */
const amountOf = (chip: HTMLElement) =>
  chip.querySelector("[torph-sr]")?.textContent ?? chip.textContent;

describe("CostBadge", () => {
  it("renders the amount as a 28px tabular chip", () => {
    render(<CostBadge credits={120} />);
    const chip = screen.getByRole("button", { name: "Thread cost $0.12" });
    expect(amountOf(chip)).toBe("$0.12");
    // Drawn characters are hidden from the reader, so the amount is announced once.
    expect(chip.querySelector("[torph-sr]")).not.toBeNull();
    expect(chip.className).toContain("h-(--h-control-sm)");
    expect(chip.className).toContain("text-xs");
    const value = chip.querySelector('[data-slot="cost-value"]');
    expect(value?.className).toContain("tabular-nums");
    expect(document.querySelector('[data-slot="cost-badge"]')).not.toBeNull();
  });

  it("shows an em dash until the amount is known", () => {
    render(<CostBadge />);
    const chip = screen.getByRole("button", { name: "Thread cost —" });
    expect(amountOf(chip)).toBe("—");
  });

  it("totals its rows and opens the breakdown card", async () => {
    render(<CostBadge rows={rows} />);
    const chip = screen.getByRole("button", { name: "Thread cost $0.50" });
    expect(amountOf(chip)).toBe("$0.50");
    fireEvent.click(chip);
    expect(await screen.findByText("Charged by Capy")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "This thread $0.30 $0.10" }),
    ).toBeTruthy();
  });
});

describe("ThreadCostBadgeControl", () => {
  it("still paints Capy's chip for a thread that has spent nothing", async () => {
    render(
      <ThreadCostBadgeControl
        threadId="jam_fresh"
        usage={{ members: [], crew: [] }}
      />,
    );
    const chip = screen.getByRole("button", { name: "Thread cost $0.00" });
    expect(amountOf(chip)).toBe("$0.00");
    fireEvent.click(chip);
    expect(await screen.findByText("Charged by Capy")).toBeTruthy();
  });
});
