import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

afterEach(cleanup);

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("Sheet", () => {
  it("keeps the content mounted and hidden while closed", () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent aria-label="Navigation">Links</SheetContent>
      </Sheet>,
    );
    expect(screen.getByText("Open").dataset.slot).toBe("sheet-trigger");
    expect(slot("sheet-content")?.hidden).toBe(true);
  });

  it("opens from the trigger with its own overlay and the left-edge panel", async () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent aria-label="Navigation" className="extra">
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText("Open"));
    const content = await screen.findByRole("dialog");
    expect(content.dataset.slot).toBe("sheet-content");
    expect(content.hidden).toBe(false);
    expect(content.className).toContain("left-0");
    expect(content.className).toContain("z-(--z-drawer)");
    expect(content.className).toContain("w-[min(88vw,--spacing(100))]");
    expect(content.className).toContain(
      "data-[starting-style]:-translate-x-full",
    );
    expect(content.className.endsWith(" extra")).toBe(true);
    expect(
      document.querySelectorAll('[data-slot="sheet-overlay"]'),
    ).toHaveLength(1);
    expect(slot("sheet-overlay")?.className).toContain("bg-overlay");
  });

  it("merges a state className function after the base classes", () => {
    render(
      <Sheet open>
        <SheetOverlay className={() => "tinted"} />
      </Sheet>,
    );
    const overlays = document.querySelectorAll<HTMLElement>(
      '[data-slot="sheet-overlay"]',
    );
    expect(overlays[0]?.className).toMatch(/^fixed inset-0 .* tinted$/);
  });
});
