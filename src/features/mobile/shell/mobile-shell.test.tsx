import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { AppLayout } from "@/features/shell/app-layout";
import { MobileTopBar } from "./mobile-shell";

beforeAll(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "768px");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.startsWith("(width") || query.startsWith("(hover: none)"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(cleanup);

const renderNarrow = async (page: React.ReactNode) => {
  const root = createRootRoute({
    component: () => <AppLayout>{page}</AppLayout>,
  });
  const route = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/new"] }),
  });
  const view = render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  return view;
};

it("frames the page in Capy's narrow chain without a second sheet", async () => {
  const { container } = await renderNarrow(
    <>
      <MobileTopBar />
      <p>page body</p>
    </>,
  );
  const main = container.querySelector(
    "[data-slot=sidebar-wrapper] [data-slot=sidebar-panel] > main",
  );
  expect(main?.textContent).toContain("page body");
  expect(
    container.querySelectorAll("[data-slot=sidebar-wrapper]"),
  ).toHaveLength(1);
  expect(container.querySelector("[data-slot=sidebar-container]")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  expect(screen.getAllByRole("dialog", { name: "Navigation" })).toHaveLength(1);
  expect(
    screen
      .getByRole("button", { name: "Close sidebar" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
