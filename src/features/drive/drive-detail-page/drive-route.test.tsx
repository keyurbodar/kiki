import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("offers the authoring controls on a Captain's drive, as Capy does", async () => {
    await renderRoute("/drive/captain/jam_sample_cap1");
    expect(await screen.findByText("CREW.md")).toBeTruthy();
    expect(screen.getByLabelText("Add")).toBeTruthy();
    expect(screen.getAllByLabelText("Delete file").length).toBeGreaterThan(0);
  });

  it("filters the file list by name and path", async () => {
    await renderRoute("/drive/organization");
    const filter = await screen.findByLabelText("Filter names and paths");
    fireEvent.change(filter, { target: { value: "style" } });
    expect(await screen.findByText("guides/style.md")).toBeTruthy();
    expect(screen.queryByText("AGENTS.md")).toBeNull();
    fireEvent.change(filter, { target: { value: "nothing-here" } });
    expect(await screen.findByText("No files match")).toBeTruthy();
  });

  it("opens a file named in the search params", async () => {
    await renderRoute("/drive/organization?file=AGENTS.md");
    expect(await screen.findByText(/Acme agent instructions/)).toBeTruthy();
  });
});
