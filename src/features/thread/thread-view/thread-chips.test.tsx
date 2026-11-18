import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";
import { MarkdownChipsProvider } from "@/components/markdown-chips";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { threadChips } from "./thread-chips";

afterEach(cleanup);

const thread = (over: Record<string, unknown>) =>
  ({
    threadNumber: 12,
    title: "Fix the checkout test",
    status: "working",
    archived: false,
    projectId: "project_kiki",
    pulls: [],
    ...over,
  }) as unknown as ThreadCard;

const pull = {
  repo: "acme/api",
  number: 7,
  title: "Add the rate limit",
  state: "ready" as const,
  additions: 12,
  deletions: 3,
  author: "keyur",
  authorAvatarUrl: "https://example.com/a.png",
  url: "https://github.com/acme/api/pull/7",
};

const codes = new Map([["project_kiki", "KIKI"]]);

it("keys a thread by the code people type", () => {
  const chips = threadChips({
    threads: [thread({ id: "jam_1" })],
    projectCodes: codes,
    currentThreadId: "jam_1",
  });
  expect(chips.threads?.get("KIKI-12")).toMatchObject({
    id: "jam_1",
    code: "KIKI-12",
    status: "working",
  });
});

it("keys a pull by owner/repo#N and reads the repository from the open thread", () => {
  const chips = threadChips({
    threads: [thread({ id: "jam_1", pulls: [pull] as never })],
    projectCodes: codes,
    currentThreadId: "jam_1",
  });
  expect(chips.pullRequests?.get("acme/api#7")).toMatchObject({
    number: 7,
    state: "ready",
    additions: 12,
  });
  expect(chips.repository).toBe("acme/api");
});

it("falls back to the bare number when the project code is unknown", () => {
  const chips = threadChips({
    threads: [thread({ id: "jam_1", projectId: null })],
    projectCodes: codes,
    currentThreadId: "jam_1",
  });
  expect(chips.threads?.has("#12")).toBe(true);
});

it("leaves a thread with no number out of the map", () => {
  const chips = threadChips({
    threads: [thread({ id: "jam_1", threadNumber: null })],
    projectCodes: codes,
    currentThreadId: "jam_1",
  });
  expect(chips.threads?.size).toBe(0);
});

async function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />).container;
}

it("turns a code and a pull reference into chips in message text", async () => {
  const chips = threadChips({
    threads: [thread({ id: "jam_1", pulls: [pull] as never })],
    projectCodes: codes,
    currentThreadId: "jam_1",
  });
  const container = await renderWithRouter(
    <MarkdownChipsProvider value={chips}>
      <Markdown text="KIKI-12 fixes acme/api#7" />
    </MarkdownChipsProvider>,
  );
  expect(container.querySelector('a[href="/thread/jam_1"]')).not.toBeNull();
  expect(container.querySelector('a[href="/pull/acme/api/7"]')).not.toBeNull();
});
