import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

// The app sidebar resolves the org's threads, folders and Captains on mount.
// Behind a real API that is milliseconds; here it costs ~21s of happy-dom waiting
// for mocks that answer over a transport that is not running, so this one test
// carries the longer budget rather than every shell test paying for it.
it("hosts the page inside the sidebar panel", { timeout: 40000 }, async () => {
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

it("opens the command palette from the shell", async () => {
  const { container } = await renderAt("/pulls");
  expect(container.querySelector("[data-slot=sidebar-wrapper]")).not.toBeNull();
  expect(document.querySelector("[data-slot=command-menu]")).toBeNull();
  fireEvent.keyDown(document, { key: "k", metaKey: true });
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(document.querySelectorAll("[data-slot=command-menu]").length).toBe(1);
});
