import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { showsWelcome } from "./home-page";

afterEach(cleanup);

async function renderHome(path = "/new") {
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

const composerSlot = () => document.querySelector("[data-slot=composer]");

describe("showsWelcome", () => {
  it("welcomes an org with nothing to start from", () => {
    expect(showsWelcome(undefined, [])).toBe(true);
  });

  it("stays out of the way of a draft or a project list", () => {
    expect(showsWelcome("Ship it", [])).toBe(false);
    expect(showsWelcome(undefined, [{ id: "proj_sample_web" }])).toBe(false);
  });
});

describe("/new", () => {
  it("centers the composer without the welcome once the org has projects", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Web app" })).toBeNull();
  });

  it("keeps the welcome out of a prompted visit", async () => {
    await renderHome("/new?prompt=Summarise%20the%20release");
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Add project" })).toBeNull();
  });
});
