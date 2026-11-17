import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultPlanCatalog, leadTerms } from "./plan-catalog";
import { LeadCard, PlanCheckout } from "./plan-picker";

afterEach(cleanup);

const lite = defaultPlanCatalog.tiers[0];

describe("LeadCard", () => {
  it("renders the current Lite plan as in Capy's plan picker", () => {
    if (lite === undefined) throw new Error("catalog");
    const onSubmit = vi.fn();
    const { container } = render(
      <LeadCard
        name="Capy Lite"
        tier="lite"
        lead={leadTerms(lite, true, "large")}
        interval="month"
        recommended={false}
        current
        disabled={false}
        selected
        submitting={false}
        ctaLabel="Current plan"
        onSelect={() => {}}
        onSubmit={onSubmit}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Current");
    expect(text).toContain("$1first week,then $20/mo");
    expect(text).toContain("500 machine hours");
    expect(text).toContain("$20 of model usage");
    expect(text).toContain("128\u00a0GB concurrent RAM");
    expect(text).not.toContain("Mobile builds and devices");
    const button = screen.getByRole("button", { name: "Current plan" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("PlanCheckout", () => {
  it("shows today's charge and hides the back link while locked", () => {
    render(
      <PlanCheckout
        terms={{
          tier: "pro",
          today: "$100",
          renewal: "$100/mo",
          action: "Pay",
        }}
      >
        <span>form</span>
      </PlanCheckout>,
    );
    expect(screen.getByText("$100", { exact: true })).toBeTruthy();
    expect(screen.getByText(/, cancel anytime/)).toBeTruthy();
    const back = screen.getByRole("button", { name: /Change plan/ });
    expect((back as HTMLButtonElement).disabled).toBe(true);
  });
});
