import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from ".";

afterEach(cleanup);

describe("Collapsible", () => {
  it("toggles the panel and rotates the chevron by group state", async () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger tone="section" block>
          Section
        </CollapsibleTrigger>
        <CollapsiblePanel keepMounted>Rows</CollapsiblePanel>
      </Collapsible>,
    );
    expect(container.firstElementChild?.getAttribute("data-slot")).toBe(
      "collapsible",
    );
    const trigger = screen.getByText("Section");
    expect(trigger.dataset.slot).toBe("collapsible-trigger");
    expect(trigger.className).toContain("w-full");
    expect(trigger.className).toContain("bg-section");
    expect(
      trigger.querySelector("[data-icon=chevron-down-small]"),
    ).not.toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const panel = screen.getByText("Rows");
    expect(panel.dataset.slot).toBe("collapsible-panel");
    expect(panel.className).toContain("h-(--collapsible-panel-height)");
  });

  it("can hide the chevron", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger showChevron={false}>Plain</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(screen.getByText("Plain").querySelector("svg")).toBeNull();
    expect(screen.getByText("Plain").className).toContain("w-fit");
  });
});
