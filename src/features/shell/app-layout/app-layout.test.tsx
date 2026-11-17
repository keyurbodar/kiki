import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AppLayout } from "./app-layout";

afterEach(cleanup);

const renderAt = async (path: string) => {
  const root = createRootRoute({
    component: () => (
      <AppLayout>
        <p>page body</p>
      </AppLayout>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const view = render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  return view;
};

it("hosts the page inside the sidebar panel", async () => {
  const { container } = await renderAt("/pulls");
  const panel = container.querySelector("[data-slot=sidebar-panel]");
  expect(panel?.querySelector("main")?.textContent).toBe("page body");
  expect(container.querySelector("[data-slot=sidebar-wrapper]")).not.toBeNull();
  expect(
    container.querySelector("[data-slot=sidebar-container]"),
  ).not.toBeNull();
});

it("hosts the settings sidebar panel on settings routes", async () => {
  const { container } = await renderAt("/settings/general");
  expect(container.querySelector("[data-slot=sidebar-wrapper]")).not.toBeNull();
  expect(
    container.querySelector("[data-slot=settings-sidebar]"),
  ).not.toBeNull();
});
