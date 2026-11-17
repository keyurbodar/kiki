import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);

const pullPath = "/pull/keyurbodar/xin/118";

async function renderPull(path = pullPath) {
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

describe("/pull/keyurbodar/xin/118", () => {
  it("renders the pull's title, checks and conversation", async () => {
    await renderPull();
    expect(
      (await screen.findAllByText("Charge retries against a time budget"))
        .length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("CI / typecheck")).toBeTruthy();
    expect(await screen.findByText("CI / e2e (web)")).toBeTruthy();
    expect(
      screen.getByText(/Does this change the default for existing callers/),
    ).toBeTruthy();
    expect(
      screen.getByText(/drains the budget at half the speed of a flapping one/),
    ).toBeTruthy();
  });

  it("lists the changed files on the diff tab", async () => {
    await renderPull(`${pullPath}?tab=diff`);
    const card = await waitFor(() => {
      const node = document.querySelector<HTMLElement>(
        '[data-diff-file="src/retry/budget.ts"]',
      );
      if (node === null) throw new Error("no diff card for budget.ts");
      return node;
    });
    expect(card.textContent).toContain("budget.ts");
    expect(
      document.querySelectorAll("[data-diff-file]").length,
    ).toBeGreaterThan(1);
  });
});
