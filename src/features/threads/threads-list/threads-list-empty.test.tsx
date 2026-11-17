import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThreadsList } from "./threads-list";

afterEach(cleanup);

async function mount(props: { loading: boolean; emptyText: string }) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThreadsList
        sections={[]}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={Date.now()}
        loading={props.loading}
        emptyText={props.emptyText}
        checked={new Set()}
        onCheckedChange={() => {}}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("threads list empty and loading states", () => {
  it("shows the skeleton while loading", async () => {
    await mount({ loading: true, emptyText: "No threads yet" });
    expect(
      document.querySelector('[aria-label="Loading threads"]'),
    ).not.toBeNull();
    expect(screen.queryByText("No threads yet")).toBeNull();
  });

  it("shows the empty copy once loading clears", async () => {
    await mount({ loading: false, emptyText: "No threads yet" });
    expect(document.querySelector('[aria-label="Loading threads"]')).toBeNull();
    expect(screen.getByText("No threads yet")).toBeTruthy();
  });
});
