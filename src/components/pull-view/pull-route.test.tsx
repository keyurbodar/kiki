import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

  it("renders the sidebar from the org's fixtures, not the sample data", async () => {
    await renderPull();
    // Each Captain draws twice now, as Capy's sidebar does: once in the pinned
    // tiles and once in the row under them.
    expect((await screen.findAllByText("Release captain")).length).toBe(2);
    expect(screen.getAllByText("Docs captain").length).toBe(2);
    expect(screen.getAllByText("Platform captain").length).toBe(2);
  });

  it("opens one file body at a time on the page host", async () => {
    await renderPull(`${pullPath}?tab=diff`);
    const first = await waitFor(() => {
      const node = document.querySelector<HTMLElement>("[data-diff-file]");
      if (node === null) throw new Error("no diff card");
      return node;
    });
    expect(first.textContent).toContain("budget.ts");
    expect(document.querySelectorAll("[data-diff-file]").length).toBe(1);
    expect(
      document.querySelectorAll('[data-slot="diff-file-body"]').length,
    ).toBe(1);
  });

  it("collapses a long unchanged run to Capy's line", async () => {
    await renderPull(`${pullPath}?tab=diff`);
    const run = await waitFor(() => {
      const node = document.querySelector<HTMLElement>(
        '[data-slot="diff-unchanged-run"]',
      );
      if (node === null) throw new Error("no collapsed unchanged run");
      return node;
    });
    expect(run.textContent).toMatch(/^\d+ unchanged lines$/);
    fireEvent.click(run);
    await waitFor(() => {
      expect(run.isConnected).toBe(false);
    });
  });
});
