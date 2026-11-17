import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AsyncResult } from "effect/reactivity";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { orgId } from "@/data/mocks/fixtures/world";
import { toThreadAutomations } from "./automations-data";
import { formatDateTime } from "./format";
import { ThreadAutomationRow } from "./thread-automation-row";

afterEach(cleanup);

function renderInRouter(node: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

describe("toThreadAutomations", () => {
  it("maps rows, pages and failures", () => {
    const rows = [
      {
        id: "auto_a",
        name: "Nightly check",
        enabled: true,
        nextRunAt: "2026-03-02T09:00:00Z",
      },
      { id: "auto_b", name: "Changelog", enabled: false },
      { name: "no id" },
    ];
    const mapped = toThreadAutomations(AsyncResult.success(rows));
    expect(mapped.map((row) => [row.id, row.enabled])).toEqual([
      ["auto_a", true],
      ["auto_b", false],
    ]);
    expect(mapped[0]?.nextRunAt?.toISOString()).toBe(
      "2026-03-02T09:00:00.000Z",
    );
    expect(
      toThreadAutomations(AsyncResult.success({ items: rows })),
    ).toHaveLength(2);
    expect(toThreadAutomations(AsyncResult.failure("down" as never))).toEqual(
      [],
    );
  });
});

describe("formatDateTime", () => {
  it("adds the year only for other years", () => {
    const now = new Date(2026, 5, 1).getTime();
    expect(formatDateTime(new Date(2026, 2, 2, 9), now)).not.toContain("2026");
    expect(formatDateTime(new Date(2027, 2, 2, 9), now)).toContain("2027");
  });
});

describe("ThreadAutomationRow", () => {
  it("shows the name and lead and opens the automation", async () => {
    const router = renderInRouter(
      <ThreadAutomationRow
        automationId="auto_sample_deps"
        name="Nightly dependency check"
        lead="Runs in this thread"
      />,
    );
    const row = await screen.findByRole("button", {
      name: "Nightly dependency check, open automation",
    });
    expect(screen.getByText("Runs in this thread")).toBeTruthy();
    fireEvent.click(row);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(router.state.location.pathname).toBe("/automation/auto_sample_deps");
  });

  it("falls back to the given name when the list cannot load", async () => {
    renderInRouter(
      <ThreadAutomationRow
        orgId={orgId}
        automationId="auto_sample_deps"
        name="Nightly dependency check"
      />,
    );
    expect(
      await screen.findByRole("button", {
        name: "Nightly dependency check, open automation",
      }),
    ).toBeTruthy();
  });
});
