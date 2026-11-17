import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);

async function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

describe("/desktop", () => {
  it("offers the browser when the desktop app can't open", async () => {
    await renderAt("/desktop?to=%2Fthread%2Ft1");
    expect(
      await screen.findByRole("heading", { name: "Desktop app unavailable" }),
    ).toBeTruthy();
    const link = screen.getByRole("link", { name: "Continue in browser" });
    expect(link.getAttribute("href")).toBe("/thread/t1");
  });

  it("falls back to /new for unsafe targets", async () => {
    await renderAt("/desktop?to=https%3A%2F%2Fexample.com");
    const link = await screen.findByRole("link", {
      name: "Continue in browser",
    });
    expect(link.getAttribute("href")).toBe("/new");
  });
});

describe("/desktop/passkey", () => {
  it("shows the expired state without a request", async () => {
    await renderAt("/desktop/passkey");
    expect(
      await screen.findByRole("heading", { name: "This link has expired" }),
    ).toBeTruthy();
  });
});

describe("/vm-handoff", () => {
  it("redirects to the thread preview pane", async () => {
    const router = await renderAt(
      "/vm-handoff?jam_id=j1&machine_id=m1&port=3000",
    );
    expect(router.state.location.pathname).toBe("/thread/j1");
    expect(router.state.location.search).toEqual({
      pane: "service-preview:m1:3000",
    });
  });
});
