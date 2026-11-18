import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SideSheet,
  SideSheetBody,
  SideSheetContent,
  SideSheetDescription,
  SideSheetFooter,
  SideSheetHeader,
  SideSheetTitle,
  SideSheetTrigger,
} from "./side-sheet";
import { isPhoneViewport } from "./use-is-phone";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockMedia = (matching: (query: string) => boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: matching(query),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

function Editor() {
  return (
    <SideSheet>
      <SideSheetTrigger>Add variables</SideSheetTrigger>
      <SideSheetContent>
        <SideSheetHeader>
          <SideSheetTitle>Add variables</SideSheetTitle>
          <SideSheetDescription>Available to every thread</SideSheetDescription>
        </SideSheetHeader>
        <SideSheetBody>Fields</SideSheetBody>
        <SideSheetFooter>Actions</SideSheetFooter>
      </SideSheetContent>
    </SideSheet>
  );
}

describe("isPhoneViewport", () => {
  it("needs both a narrow viewport and a coarse touch pointer", () => {
    mockMedia(() => true);
    expect(isPhoneViewport()).toBe(true);
    mockMedia((query) => !query.includes("pointer"));
    expect(isPhoneViewport()).toBe(false);
  });
});

describe("SideSheet", () => {
  it("opens as a right-edge dialog with header close and footer rule", async () => {
    mockMedia(() => false);
    render(<Editor />);
    fireEvent.click(screen.getByText("Add variables"));
    const content = await screen.findByRole("dialog");
    expect(content.dataset.slot).toBe("side-sheet-content");
    expect(content.className).toContain("right-0");
    expect(content.className).toContain("w-160");
    expect(content.className).toContain("z-(--z-dialog)");
    expect(slot("side-sheet-overlay")?.className).toContain("bg-overlay");
    expect(slot("side-sheet-title")?.className).toContain("text-base");
    expect(slot("side-sheet-description")?.className).toContain(
      "text-muted-foreground-2",
    );
    expect(slot("side-sheet-body")?.className).toContain("overflow-y-auto");
    expect(slot("side-sheet-body")?.className).toContain("gap-5");
    expect(slot("side-sheet-description")?.className).toContain("flex flex-col");
    expect(slot("side-sheet-footer")?.className).toContain("border-t-hairline");
    expect(slot("side-sheet-footer")?.className).toContain("justify-between");
    expect(slot("side-sheet-footer")?.className).toContain("items-center");
    expect(slot("side-sheet-footer")?.className).toContain("flex-wrap");

    const close = slot("side-sheet-close");
    expect(close?.textContent).toBe("Close");
    fireEvent.click(close as HTMLElement);
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("becomes a drawer without the close button or footer rule on phones", async () => {
    mockMedia(() => true);
    render(<Editor />);
    fireEvent.click(screen.getByText("Add variables"));
    await vi.waitFor(() => expect(slot("drawer-content")).not.toBeNull());
    expect(slot("side-sheet-content")).toBeNull();
    expect(slot("side-sheet-close")).toBeNull();
    expect(slot("side-sheet-footer")?.className).not.toContain("border-t");
  });
  it("applies className callbacks on the phone drawer path", async () => {
    mockMedia(() => true);
    render(
      <SideSheet open>
        <SideSheetContent className={() => "custom-panel"}>
          panel
        </SideSheetContent>
      </SideSheet>,
    );
    await vi.waitFor(() => expect(slot("drawer-content")).not.toBeNull());
    expect(slot("drawer-content")?.className).toContain("custom-panel");
  });
});
