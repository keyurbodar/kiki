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

  it("anchors below the trigger, aligned to its start, as in Capy", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );
    const content = await screen.findByText("Body");
    const positioner = content.parentElement;
    expect(positioner?.dataset.side).toBe("bottom");
    expect(positioner?.dataset.align).toBe("start");
    expect(content.role).toBe("dialog");
    expect(screen.getByText("Open").getAttribute("aria-controls")).toBe(
      content.id,
    );
  });

  it("forwards side, align and the anchor to the positioner", async () => {
    const { rerender } = render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="top" align="end">
          Body
        </PopoverContent>
      </Popover>,
    );
    let content = await screen.findByText("Body");
    expect(content.parentElement?.dataset.side).toBe("top");
    expect(content.parentElement?.dataset.align).toBe("end");

    const anchor = document.createElement("div");
    document.body.append(anchor);
    rerender(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="right" anchor={anchor}>
          Body
        </PopoverContent>
      </Popover>,
    );
    content = await screen.findByText("Body");
    expect(content.parentElement?.dataset.side).toBe("right");
    expect(content.parentElement?.dataset.align).toBe("start");
    anchor.remove();
  });

  it("portals the content into the given container", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent container={container}>Body</PopoverContent>
      </Popover>,
    );
    const content = await screen.findByText("Body");
    expect(container.contains(content)).toBe(true);
    expect(screen.getByText("Open").contains(content)).toBe(false);
    container.remove();
  });

  it("keeps the variant classes when the caller adds its own", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="rounded-none">Body</PopoverContent>
      </Popover>,
    );
    const content = await screen.findByText("Body");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("border-hairline");
    expect(content.className.endsWith("rounded-none")).toBe(true);
  });

  it("leaves the surface visible and adds no arrow by default", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );
    const content = await screen.findByText("Body");
    expect(content.className).toContain("overflow-hidden");
    expect(content.className).not.toContain("overflow-visible");
    expect(content.querySelector(".rotate-45")).toBeNull();
  });
});
