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

async function renderRoute(path: string) {
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

const crumb = () => document.querySelector("h1")?.textContent ?? "";

describe("drive scope routes", () => {
  it("lists the organization scope's files under a Drive crumb", async () => {
    await renderRoute("/drive/organization");
    expect(await screen.findByText("AGENTS.md")).toBeTruthy();
    expect(await screen.findByText("guides/style.md")).toBeTruthy();
    expect(crumb()).toContain("Drive");
    expect(crumb()).toContain("Acme");
  });

  it("offers the empty state and its three actions on a scope with no files", async () => {
    await renderRoute("/project/proj_sample_docs/drive/personal");
    expect(await screen.findByText("No files yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Add a skill or instructions by hand, or ask Capy in a thread",
      ),
    ).toBeTruthy();
    expect(screen.getByText("New skill")).toBeTruthy();
    expect(screen.getByText("Add instructions")).toBeTruthy();
    expect(screen.getByText("Upload")).toBeTruthy();
    expect(document.querySelector('[data-slot="menu-trigger"]')).toBeTruthy();
    expect(crumb()).toContain("Drive");
  });

  it("opens a file named in the search params", async () => {
    await renderRoute("/drive/organization?file=AGENTS.md");
    expect(await screen.findByText(/Acme agent instructions/)).toBeTruthy();
  });
});
