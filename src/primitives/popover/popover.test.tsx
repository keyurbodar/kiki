import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverContentVariants,
} from ".";

afterEach(cleanup);

describe("Popover", () => {
  it("opens on click and renders the default surface", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByText("Open");
    expect(trigger.dataset.slot).toBe("popover-trigger");
    fireEvent.click(trigger);
    const content = await screen.findByText("Body");
    expect(content.dataset.slot).toBe("popover-content");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("origin-(--transform-origin)");
    expect(content.parentElement?.className).toContain(
      "z-(--z-overlay-content)",
    );
  });

  it("keeps motion but drops the surface for the unstyled variant", () => {
    const unstyled = popoverContentVariants({ variant: "unstyled" });
    expect(unstyled).toContain("data-[starting-style]:opacity-0");
    expect(unstyled).not.toContain("bg-popover");
  });

  it("renders an arrow when asked", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent arrow>Body</PopoverContent>
      </Popover>,
    );
    const content = await screen.findByText("Body");
    expect(content.className).toContain("overflow-visible");
    expect(content.querySelector(".rotate-45")).not.toBeNull();
  });
});
