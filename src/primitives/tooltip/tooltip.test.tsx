import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

afterEach(cleanup);

describe("Tooltip", () => {
  it("renders Capy's slots and popup classes", async () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText("Hover").dataset.slot).toBe("tooltip-trigger");
    const content = await screen.findByText("Archive");
    expect(content.dataset.slot).toBe("tooltip-content");
    expect(content.className).toContain("data-[open]:animate-tooltip-in");
    expect(content.parentElement?.className).toContain("z-(--z-tooltip)");
  });

  it("lays out a shortcut chip beside the label", async () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent shortcut="⌘K">Search</TooltipContent>
      </Tooltip>,
    );
    const label = await screen.findByText("Search");
    const popup = label.closest("[data-slot=tooltip-content]");
    expect(popup?.className).toContain("flex items-center gap-1.5");
    expect(screen.getByText("⌘K").dataset.slot).toBe("kbd");
  });
});
