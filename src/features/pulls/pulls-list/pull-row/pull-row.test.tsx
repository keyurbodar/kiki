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
  repoAvatarUrl: "",
  url: "https://github.com/acme/web/pull/128",
  headRef: "feat/dark-mode",
  baseRef: "main",
  threadId: null,
  thread: null,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});

const renderRow = (card: PullCard) => {
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
  it("prints the repository owner's avatar between the code and title", async () => {
    renderRow(pull({ repoAvatarUrl: "https://avatars.example/u/1" }));
    const avatar = await screen.findByRole("img", { name: "acme" });
    expect(avatar.getAttribute("src")).toBe("https://avatars.example/u/1");
  });

  it("falls back to the owner's initial without an avatar", async () => {
    renderRow(pull({}));
    expect(await screen.findByText("a")).toBeTruthy();
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
