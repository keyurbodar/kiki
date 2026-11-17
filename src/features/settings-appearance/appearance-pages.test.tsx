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
}

describe("appearance pages", () => {
  it("renders Appearance", async () => {
    await renderAt("/settings/appearance");
    expect(
      await screen.findByRole("heading", { name: "Appearance", level: 1 }),
    ).toBeTruthy();
  });

  it("lists your themes with their status", async () => {
    await renderAt("/settings/appearance/themes");
    expect(
      await screen.findByRole("heading", { name: "Your themes" }),
    ).toBeTruthy();
    expect(await screen.findByText("Not published")).toBeTruthy();
  });

  it("renders the publish page for a theme", async () => {
    await renderAt("/settings/appearance/themes/theme_sample_paper");
    expect(await screen.findByRole("heading", { name: "Paper" })).toBeTruthy();
    expect(screen.getByText("Submit to Explore")).toBeTruthy();
  });

  it("explains a theme that isn't in the library", async () => {
    await renderAt("/settings/appearance/themes/theme_missing");
    expect(
      await screen.findByText("This theme isn't in your library"),
    ).toBeTruthy();
  });
});
