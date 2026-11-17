import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

const { providerProps } = vi.hoisted(() => ({ providerProps: vi.fn() }));

vi.mock("@base-ui/react/tooltip", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@base-ui/react/tooltip")>();
  return {
    ...actual,
    Tooltip: {
      ...actual.Tooltip,
      Provider: (props: Record<string, unknown>) => {
        providerProps(props);
        return createElement(actual.Tooltip.Provider, props);
      },
    },
  };
});

afterEach(() => {
  cleanup();
  providerProps.mockClear();
});

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
    expect(content.className).toContain("data-[closed]:animate-tooltip-out");
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
    expect(label.className).toContain("min-w-0");
    const chip = screen.getByText("⌘K");
    expect(chip.dataset.slot).toBe("kbd");
    expect(chip.className).toContain("-mr-0.5 shrink-0 whitespace-nowrap");
  });

  it("leaves the label bare without a shortcut", async () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Archive</TooltipContent>
      </Tooltip>,
    );
    const popup = (await screen.findByText("Archive")).closest(
      "[data-slot=tooltip-content]",
    );
    expect(popup?.className).not.toContain("flex items-center gap-1.5");
    expect(popup?.childElementCount).toBe(0);
  });

  it("lets a caller className win over the variant classes", async () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent className="max-w-none">Archive</TooltipContent>
      </Tooltip>,
    );
    const popup = (await screen.findByText("Archive")).closest(
      "[data-slot=tooltip-content]",
    );
    expect(popup?.className.endsWith("max-w-none")).toBe(true);
  });

  it("defaults the provider to Capy's hover delay and group timeout", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(providerProps).toHaveBeenCalledWith(
      expect.objectContaining({ delay: 300, timeout: 1000 }),
    );
  });

  it("keeps a caller's provider timing", () => {
    render(
      <TooltipProvider delay={0} timeout={50}>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(providerProps).toHaveBeenCalledWith(
      expect.objectContaining({ delay: 0, timeout: 50 }),
    );
  });
});
