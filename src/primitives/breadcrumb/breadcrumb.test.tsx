import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Breadcrumb } from "@/primitives/breadcrumb";

afterEach(cleanup);

it("links back to the parent page with a chevron", async () => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <Breadcrumb to="/settings/general" label="Settings" className="mb-2" />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await act(() => router.load());
  render(<RouterProvider router={router} />);
  const link = await screen.findByRole("link", { name: "Settings" });
  expect(link.getAttribute("href")).toBe("/settings/general");
  expect(link.dataset.slot).toBe("breadcrumb");
  expect(link.className).toContain("mb-2");
  expect(link.querySelector("svg")?.dataset.icon).toBe("chevron-left-medium");
});
