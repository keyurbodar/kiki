import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerTitle,
  DrawerTrigger,
} from ".";
import {
  DISMISS_HEIGHT_FRACTION,
  dragOffset,
  OVERDRAG_RESISTANCE,
  shouldDismiss,
} from "./use-drawer-drag";

afterEach(cleanup);

const nextFrame = () =>
  act(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );

function renderOpen(
  props: { onOpenChange?: (open: boolean) => void; ornament?: string } = {},
) {
  render(
    <Drawer defaultOpen onOpenChange={props.onOpenChange}>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent ornament={props.ornament}>
        <DrawerTitle>Title</DrawerTitle>
        <p>Body</p>
      </DrawerContent>
    </Drawer>,
  );
  const content = document.querySelector<HTMLElement>(
    "[data-slot=drawer-content]",
  );
  if (!content) throw new Error("drawer content not rendered");
  return content;
}

describe("drag maths", () => {
  it("follows the pointer down and resists upward drags", () => {
    expect(dragOffset(40)).toBe(40);
    expect(dragOffset(0)).toBe(0);
    expect(dragOffset(-40)).toBe(-40 / OVERDRAG_RESISTANCE);
  });

  it("dismisses past a quarter of the height or on a downward flick", () => {
    const height = 400;
    const quarter = height * DISMISS_HEIGHT_FRACTION;
    expect(shouldDismiss(quarter + 1, height, 0)).toBe(true);
    expect(shouldDismiss(quarter, height, 0)).toBe(false);
    expect(shouldDismiss(20, height, 0.5)).toBe(true);
    expect(shouldDismiss(20, height, 0.4)).toBe(false);
    expect(shouldDismiss(-20, height, 2)).toBe(false);
  });
});

describe("Drawer", () => {
  it("opens from the trigger into a bottom sheet with overlay and handle", async () => {
    render(
      <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>Body</DrawerContent>
      </Drawer>,
    );
    const trigger = screen.getByText("Open");
    expect(trigger.dataset.slot).toBe("drawer-trigger");
    fireEvent.click(trigger);
    const body = await screen.findByText("Body");
    const scroller = body;
    expect(scroller.className).toContain("overscroll-contain");
    expect(scroller.className).toContain("md:scroll-fade-y");
    const content = scroller.parentElement as HTMLElement;
    expect(content.dataset.slot).toBe("drawer-content");
    expect(content.className).toContain("bottom-0");
    expect(content.className).toContain("rounded-t-(--radius-panel)");
    expect(content.className).toContain(
      "data-[starting-style]:translate-y-full",
    );
    expect(content.parentElement?.className).toContain("group/drawer-portal");
    const overlay = document.querySelector("[data-slot=drawer-overlay]");
    expect(overlay?.className).toContain("bg-overlay");
    const handle = content.querySelector("[data-slot=drawer-handle]");
    expect(handle?.tagName).toBe("BUTTON");
    expect(handle?.textContent).toBe("Close");
  });

  it("drops the scroll fade and positions the ornament when asked", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent scrollFade={false} ornament={<span>Ornament</span>}>
          Body
        </DrawerContent>
      </Drawer>,
    );
    const scroller = screen.getByText("Body");
    expect(scroller.className).not.toContain("scroll-fade-y");
    expect(scroller.className).toContain("relative");
    const content = scroller.parentElement as HTMLElement;
    expect(content.firstElementChild?.textContent).toBe("Ornament");
    expect(
      content.querySelector("[data-slot=drawer-handle]")?.className,
    ).toContain("relative");
  });

  it("closes from the handle", () => {
    const onOpenChange = vi.fn();
    const content = renderOpen({ onOpenChange });
    const handle = content.querySelector("[data-slot=drawer-handle]");
    fireEvent.click(handle as Element);
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("dismisses when dragged down past the threshold", async () => {
    const onOpenChange = vi.fn();
    const content = renderOpen({ onOpenChange });
    const handle = content.querySelector(
      "[data-slot=drawer-handle]",
    ) as Element;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 160 });
    expect(content.hasAttribute("data-dragging")).toBe(true);
    await nextFrame();
    expect(content.style.getPropertyValue("translate")).toBe("0 60px");
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 160 });
    expect(content.hasAttribute("data-dragging")).toBe(false);
    expect(content.style.getPropertyValue("translate")).toBe("0 100%");
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("snaps back after an upward drag", async () => {
    const onOpenChange = vi.fn();
    const content = renderOpen({ onOpenChange });
    const handle = content.querySelector(
      "[data-slot=drawer-handle]",
    ) as Element;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 20 });
    await nextFrame();
    expect(content.style.getPropertyValue("translate")).toBe("0 -10px");
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 20 });
    expect(content.style.getPropertyValue("translate")).toBe("0 0");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("ignores small moves and other pointers", () => {
    const content = renderOpen();
    const handle = content.querySelector(
      "[data-slot=drawer-handle]",
    ) as Element;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 102 });
    fireEvent.pointerMove(handle, { pointerId: 2, clientY: 300 });
    expect(content.hasAttribute("data-dragging")).toBe(false);
  });

  it("hands upward drags inside the body back to scrolling", () => {
    const content = renderOpen();
    const body = screen.getByText("Body");
    fireEvent.pointerDown(body, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(body, { pointerId: 1, clientY: 50 });
    fireEvent.pointerMove(body, { pointerId: 1, clientY: 300 });
    expect(content.hasAttribute("data-dragging")).toBe(false);
  });

  it("snaps back when the pointer is cancelled mid drag", async () => {
    const content = renderOpen();
    const handle = content.querySelector(
      "[data-slot=drawer-handle]",
    ) as Element;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 200 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    expect(content.hasAttribute("data-dragging")).toBe(false);
    expect(content.style.getPropertyValue("translate")).toBe("0 0");
  });

  it("renders a standalone overlay with its slot", () => {
    render(
      <Drawer defaultOpen>
        <DrawerOverlay className="extra" />
      </Drawer>,
    );
    const overlay = document.querySelector("[data-slot=drawer-overlay]");
    expect(overlay?.className).toContain("z-(--z-drawer)");
    expect(overlay?.className).toContain("extra");
  });
});
