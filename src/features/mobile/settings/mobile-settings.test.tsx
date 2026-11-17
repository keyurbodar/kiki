import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { MobileSettingsSheet } from "./mobile-settings-sheet";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

let narrow = true;

beforeAll(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "48rem");
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return narrow;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  narrow = true;
});

const renderSheet = async (open: boolean, onOpenChange = vi.fn()) => {
  const root = createRootRoute({
    component: () => (
      <>
        <p>page body</p>
        <MobileSettingsSheet open={open} onOpenChange={onOpenChange} />
      </>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/settings/general"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  return onOpenChange;
};

it("shows the settings sidebar in the Navigation sheet on phones", async () => {
  const onOpenChange = await renderSheet(true);
  const sheet = await screen.findByRole("dialog", { name: "Navigation" });
  expect(sheet.getAttribute("data-slot")).toBe("sheet-content");
  expect(sheet.querySelector("[data-slot=settings-sidebar]")).not.toBeNull();
  expect(screen.getByRole("textbox", { name: "Search settings" })).toBeTruthy();
  const trigger = screen.getByRole("button", { name: "Close sidebar" });
  expect(trigger.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(trigger);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("renders nothing and closes itself at md and wider", async () => {
  narrow = false;
  const onOpenChange = await renderSheet(true);
  expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull();
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("labels the trigger like Capy's SidebarTrigger", () => {
  const onToggle = vi.fn();
  render(<MobileSidebarTrigger open={false} onToggle={onToggle} />);
  const trigger = screen.getByRole("button", { name: "Open sidebar" });
  expect(trigger.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(trigger);
  expect(onToggle).toHaveBeenCalledOnce();
});
