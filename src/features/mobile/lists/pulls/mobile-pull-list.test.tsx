import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { MobilePullList } from "./mobile-pull-list";
import type { MobilePullListItem } from "./mobile-pull-row";

let narrow = true;

beforeAll(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "48rem");
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return narrow;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  narrow = true;
});

const pull = (
  id: string,
  number: number,
  state: MobilePullListItem["state"],
  title: string,
): MobilePullListItem => ({
  id,
  number,
  title,
  state,
  repoFullName: "acme/sample",
  additions: 12,
  deletions: 3,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  threadCode: "SAMPLE-7",
});

const sections = [
  {
    id: "ready",
    label: "Ready to merge",
    members: [pull("p1", 101, "ready", "Sample pull request")],
  },
  {
    id: "merged",
    label: "Merged",
    members: [pull("p2", 102, "merged", "Merged sample pull")],
  },
];

const renderList = async (
  props: Partial<Parameters<typeof MobilePullList>[0]> = {},
  ready: RegExp | null = /Ready to merge/,
) => {
  const root = createRootRoute({
    component: () => (
      <MobilePullList
        sections={sections}
        now={Date.now()}
        loading={false}
        emptyText="No open pull requests"
        {...props}
      />
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/pulls"] }),
  });
  render(<RouterProvider router={router} />);
  if (ready === null) await screen.findByText("No open pull requests");
  else await screen.findByRole("button", { name: ready });
};

it("draws state sections around pull rows on phones", async () => {
  await renderList();
  const ready = screen.getByRole("button", { name: /Ready to merge/ });
  expect(ready.getAttribute("data-slot")).toBe("collapsible-trigger");
  const row = screen
    .getByText("Sample pull request")
    .closest("[data-pull-row]");
  expect(row?.getAttribute("data-pull-row")).toBe("p1");
  expect(row?.getAttribute("href")).toBe("/pull/acme/sample/101");
});

it("labels each row with its pull state", async () => {
  await renderList();
  expect(screen.getAllByRole("img", { name: "ready" }).length).toBe(1);
});

it("writes the empty line when no pull matches", async () => {
  await renderList({ sections: [] }, null);
  expect(await screen.findByText("No open pull requests")).toBeTruthy();
});

it("renders nothing above the narrow breakpoint", async () => {
  narrow = false;
  const root = createRootRoute({
    component: () => (
      <>
        <p>page body</p>
        <MobilePullList
          sections={sections}
          now={Date.now()}
          loading={false}
          emptyText="No open pull requests"
        />
      </>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/pulls"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  expect(screen.queryByText("Ready to merge")).toBeNull();
});
