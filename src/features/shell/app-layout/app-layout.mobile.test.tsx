import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const PHONE_WIDTH = "48rem";

beforeEach(() => {
  document.documentElement.style.setProperty("--breakpoint-md", PHONE_WIDTH);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes(PHONE_WIDTH),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  vi.resetModules();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty("--breakpoint-md");
});

it("opens the phone navigation sheet from the settings crumb bar", async () => {
  const { AppLayout } = await import("./app-layout");
  const { SettingsLayout } = await import("@/features/settings/shell");
  const root = createRootRoute({
    component: () => (
      <AppLayout>
        <SettingsLayout>
          <p>page body</p>
        </SettingsLayout>
      </AppLayout>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/settings/general"] }),
  });
  const { container } = render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  expect(container.querySelector("[data-slot=sidebar-container]")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(document.querySelector("[data-slot=settings-sidebar]")).not.toBeNull();
});
