import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient";
import { captains, orgId } from "@/data/mocks/fixtures/world";
import { MockTransport } from "@/data/mocks/MockServices";
import { ThreadScreen } from "@/features/thread/thread-route/thread-route";
import { buildTimeline } from "@/features/thread/timeline/build";
import {
  decodeEventPage,
  emptyFeed,
  historyLoaded,
} from "@/features/thread/timeline/feed";
import { searchParams } from "@/lib/search-params";

/** The jam id our parity captures open for a full transcript. */
const transcriptThread = "jam_01M7FSZ5JHHYSDA2WM61W88WEG";
const title = "Wire the retry budget into the release pipeline";
const firstMessage =
  "Give the release pipeline a retry budget so one flaky shard cannot fail a release.";

/**
 * happy-dom reports zero layout, and the chat's virtualised list renders no
 * rows until it measures a viewport, so give the scroller a real one.
 */
const chatViewport = 900;

const rect = (height: number, width: number) =>
  ({
    height,
    width,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({ height, width }),
  }) as DOMRect;

const measuredRect = HTMLElement.prototype.getBoundingClientRect;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains("chat-scroller")
        ? rect(chatViewport, 800)
        : { ...measuredRect.call(this), height: 76 };
    },
  );
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => chatViewport,
  });
});

afterEach(cleanup);

async function renderRoute(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const threadRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/thread/$threadId",
    validateSearch: searchParams(["pane"]),
    component: () => {
      const { threadId } = threadRoute.useParams();
      const { pane } = threadRoute.useSearch();
      return <ThreadScreen threadId={threadId} pane={pane} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([threadRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

const chatRows = () =>
  [...document.querySelectorAll("[data-chat-row-id]")].map(
    (row) => row.textContent ?? "",
  );

describe("thread route transcript for the capture ids", () => {
  it("renders the seeded history instead of an untitled shell", async () => {
    await renderRoute(`/thread/${transcriptThread}`);

    expect(
      await screen.findByText(title, undefined, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Untitled thread")).toBeNull();

    expect(
      await screen.findByText(firstMessage, undefined, { timeout: 3000 }),
    ).toBeTruthy();
    const rows = chatRows();
    expect(rows.length).toBeGreaterThan(10);
    expect(
      document.querySelectorAll('[data-slot="user-message"]').length,
    ).toBeGreaterThan(1);

    // The running call's row, and the error row that stopped the first attempt.
    expect(screen.getByText("Watching the release run")).toBeTruthy();
    expect(screen.getByText(/Shard 3 timed out on both attempts/)).toBeTruthy();

    // An agent bubble with a heading, bold, a list, inline code and a fence.
    const bubble = document.querySelector('[data-slot="agent-message"]');
    expect(bubble?.querySelector("h2")?.textContent).toBe(
      "Release pipeline retry",
    );
    expect(bubble?.querySelector("strong")).not.toBeNull();
    expect(bubble?.querySelector("li")).not.toBeNull();
    expect(bubble?.querySelector("code")).not.toBeNull();
    expect(
      document.querySelector('[data-slot="agent-message"] pre'),
    ).not.toBeNull();

    expect(
      screen.getByRole("button", { name: "Thread cost $3.24" }),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-slot="composer-footer"]'),
    ).not.toBeNull();
  });
});

describe("a Captain's thread", () => {
  const captain = captains.find((seed) => seed.name === "Platform captain");

  // A Captain is a thread the sidebar links to: it opens with its own name and
  // conversation, not as an untitled shell over a skeleton.
  it("renders its name and history instead of an untitled skeleton", async () => {
    await renderRoute(`/thread/${captain?.id}`);
    expect(
      await screen.findByText("Platform captain", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Untitled thread")).toBeNull();
    expect(
      await screen.findByText(/which branch the checkout retry fix went to/),
    ).toBeTruthy();
    expect(screen.queryByText("Couldn't load this conversation")).toBeNull();
  }, 15_000);
});

const otherCaptureThreads = [
  {
    jamId: "jam_01M7MFTGG7Q15WKEF7TW3PQG37",
    title: "Shard the release test suite",
  },
  {
    jamId: "jam_01M7MMQJAA80M4FEDRSNZVFGG5",
    title: "Plan the pipeline hardening work",
  },
  {
    jamId: "jam_01M7FP6GKY49R183VW3NBE3Y2Z",
    title: "Trace the flaky shard timeout",
  },
];

describe("the other capture threads", () => {
  it("render their own title and a transcript row", async () => {
    for (const thread of otherCaptureThreads) {
      await renderRoute(`/thread/${thread.jamId}`);
      expect(
        await screen.findByText(thread.title, undefined, { timeout: 3000 }),
      ).toBeTruthy();
      expect(screen.queryByText("Untitled thread")).toBeNull();
      expect(chatRows().length).toBeGreaterThan(0);
      cleanup();
    }
  });
});

describe("the capture history's shapes", () => {
  const load = (jamId: string) =>
    Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const body = yield* client.events.list({
          params: { orgId, jamId },
          query: {},
        });
        return yield* decodeEventPage(body);
      }).pipe(Effect.provide(makeApiClientLayer(MockTransport))),
    );

  it("carries markdown, code, a settled call, a running call and an error", async () => {
    const page = await load(transcriptThread);
    const feed = historyLoaded(emptyFeed, page);
    const timeline = buildTimeline(feed.events, {
      liveEntries: [],
      liveSettled: false,
      truncatedHistory: feed.olderCursor !== null,
      expandedGroupIds: new Map(),
    });
    expect(page.items.length).toBeGreaterThan(40);
    expect(timeline.rows.length).toBeGreaterThan(10);

    const written = page.items
      .flatMap((row) => {
        if (row.kind !== "assistant") return [];
        return row.payload.blocks.flatMap((block) => {
          if (block.type === "text") return [block.text];
          if (block.type !== "tool_use") return [];
          const args = block.args as { text?: unknown };
          return typeof args.text === "string" ? [args.text] : [];
        });
      })
      .join("\n");
    expect(written).toContain("## Release pipeline retry");
    expect(written).toContain("**single flaky test**");
    expect(written).toContain("```sh");
    expect(
      page.items.filter((row) => row.kind === "assistant").length,
    ).toBeGreaterThan(10);

    const calls = page.items.flatMap((row) =>
      row.kind === "assistant"
        ? row.payload.blocks.flatMap((block) =>
            block.type === "tool_use" ? [block.toolCallId] : [],
          )
        : [],
    );
    const settled = new Set(
      page.items.flatMap((row) =>
        row.kind === "tool_result" ? [row.payload.toolCallId] : [],
      ),
    );
    expect(calls.some((call) => settled.has(call))).toBe(true);
    expect(calls.some((call) => !settled.has(call))).toBe(true);
    expect(
      page.items.some(
        (row) => row.kind === "error" && row.state === "committed",
      ),
    ).toBe(true);
  });
});
