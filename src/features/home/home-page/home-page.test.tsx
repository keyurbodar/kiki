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

  it("puts the project, run-on and repo-branch selects above the composer", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    const row = document.querySelector(
      "[data-slot=composer]",
    )?.previousElementSibling;
    expect(row?.querySelector("[data-slot=project-select]")).not.toBeNull();
    expect(row?.querySelector("[data-slot=run-on-select]")).not.toBeNull();
    expect(row?.querySelector("[data-slot=repo-branch-select]")).not.toBeNull();
  });

  it("gives the composer its model picker and the /new placeholder", async () => {
    await renderHome();
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.getByRole("button", { name: "Model" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to message" })).toBeTruthy();
    expect(screen.getByText(", / for commands, @ for context")).toBeTruthy();
  });

  it("keeps the welcome out of a prompted visit", async () => {
    await renderHome("/new?prompt=Summarise%20the%20release");
    await waitFor(() => expect(composerSlot()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Add project" })).toBeNull();
  });
});
