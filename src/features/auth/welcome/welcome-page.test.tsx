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

describe("/welcome", () => {
  it("shows the intro with sign-in and sign-up links", async () => {
    await renderAt("/welcome?redirect_url=%2Fthreads");
    expect(
      await screen.findByRole("heading", {
        name: "The best AI software engineer",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: "Capy" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/sign-in");
    expect(
      screen
        .getByRole("link", { name: "Create an account" })
        .getAttribute("href"),
    ).toBe("/sign-up?redirect_url=%2Fthreads");
  });
});
