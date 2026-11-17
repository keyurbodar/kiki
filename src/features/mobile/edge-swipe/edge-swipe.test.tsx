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

it("keeps the navigation sheet closed on a left-edge swipe", async () => {
  await renderNarrow(<p>page body</p>);
  const page = screen.getByText("page body");
  const touch = { pointerType: "touch", clientY: 400 };
  fireEvent.pointerDown(page, { ...touch, clientX: 2 });
  fireEvent.pointerMove(page, { ...touch, clientX: 300 });
  fireEvent.pointerUp(page, { ...touch, clientX: 300 });
  expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull();
});
