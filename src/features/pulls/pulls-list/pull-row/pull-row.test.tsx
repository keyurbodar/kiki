import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PullCard } from "@/features/pulls/pulls-page/data/pull";
import { PullRow } from "./pull-row";

afterEach(cleanup);

const pull = (overrides: Partial<PullCard>): PullCard => ({
  id: "pr_1",
  projectId: null,
  repo: "acme/web",
  number: 128,
  title: "Add dark mode to settings",
  state: "ready",
  checksState: "passed",
  additions: 42,
  deletions: 7,
  author: "sam",
  authorAvatarUrl: "",
  url: "https://github.com/acme/web/pull/128",
  headRef: "feat/dark-mode",
  baseRef: "main",
  threadId: null,
  thread: null,
  createdAt: 0,
  updatedAt: 0,
  diffBreakdown: null,
  ...overrides,
});

const renderRow = (card: PullCard, pinned = false, onTogglePin = () => {}) => {
  const root = createRootRoute();
  const rowRoute = createRoute({
    getParentRoute: () => root,
    path: "/pull/$owner/$repo/$prNumber",
    component: () => (
      <PullRow
        pull={card}
        now={0}
        selected={false}
        checked={false}
        selectionMode={false}
        onCheck={() => {}}
        pinned={pinned}
        onTogglePin={onTogglePin}
      />
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([rowRoute]),
    history: createMemoryHistory({ initialEntries: ["/pull/acme/web/128"] }),
  });
  return render(<RouterProvider router={router} />);
};

describe("PullRow", () => {
  it("wraps the row in the context menu Capy opens on it", async () => {
    const { container } = renderRow(pull({}));
    await screen.findByText("Add dark mode to settings");
    expect(
      container.querySelector("[data-slot=context-menu-trigger]"),
    ).not.toBeNull();
  });

  it("prints the author's avatar between the code and title", async () => {
    const { container } = renderRow(pull({}));
    await screen.findByText("Add dark mode to settings");
    const row = container.querySelector("[data-pull-row]");
    const cells = [...(row?.children ?? [])];
    expect(cells[2]?.textContent).toBe("#128");
    expect(cells[3]?.textContent).toBe("S");
    expect(cells[4]?.textContent).toBe("Add dark mode to settings");
  });

  it("prints the author's image when the pull carries one", async () => {
    const { container } = renderRow(
      pull({
        author: "sam",
        authorAvatarUrl: "https://example.com/avatars/sam.png",
      }),
    );
    await screen.findByText("Add dark mode to settings");
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe(
      "https://example.com/avatars/sam.png",
    );
    expect(image?.getAttribute("alt")).toBe("sam");
  });

  it("opens the diff breakdown from the stat", async () => {
    renderRow(
      pull({
        diffBreakdown: {
          database: { files: 1, additions: 4, deletions: 1 },
          tests: { files: 2, additions: 18, deletions: 3 },
          generated: { files: 0, additions: 0, deletions: 0 },
        },
      }),
    );
    await screen.findByText("Add dark mode to settings");
    expect(
      screen.getByLabelText("Diff counts and hidden file categories"),
    ).toBeTruthy();
  });

  it("prints the project chip of the linked thread", async () => {
    renderRow(
      pull({
        threadId: "jam_1",
        thread: {
          id: "jam_1",
          number: 30,
          title: "Policy work",
          projectCode: "XIN",
          archived: false,
        },
      }),
    );
    const chip = await screen.findByLabelText("Open thread XIN-30");
    expect(chip.textContent).toContain("XIN-30");
  });

  it("prints no chip for a pull without a thread", async () => {
    renderRow(pull({}));
    expect(screen.queryByLabelText(/^Open thread/)).toBeNull();
  });
});
