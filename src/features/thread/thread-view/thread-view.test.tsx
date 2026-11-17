import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render } from "@testing-library/react";
import { Schema } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeThreadFixtures, TimelineRow } from "@/data/events";
import type { ThreadTimeline } from "@/features/thread/timeline";
import { ThreadRoute } from "@/routes/_app/thread/$threadId";
import { ThreadView } from "./thread-view";

const decodeRow = Schema.decodeUnknownSync(TimelineRow);

const rows = makeThreadFixtures().rows.map((row) => decodeRow(row));

const timeline = (overrides: Partial<ThreadTimeline> = {}): ThreadTimeline => ({
  rows: [],
  gaps: new Map(),
  pendingAsk: undefined,
  pendingEnvironment: undefined,
  queued: [],
  turnOpen: false,
  live: { phase: "idle" } as ThreadTimeline["live"],
  loading: false,
  loadingOlder: false,
  hasOlder: false,
  loadOlder: () => undefined,
  ...overrides,
});

vi.mock("@/features/composer/context-meter", () => ({
  ContextMeter: ({ orgId, jamId }: { orgId: string; jamId: string }) => (
    <div data-slot="context-meter" data-org={orgId} data-jam={jamId} />
  ),
}));

const current = vi.hoisted(() => ({
  timeline: undefined as unknown as ThreadTimeline,
}));

vi.mock("@/features/thread/timeline", () => ({
  useThreadTimeline: () => current.timeline,
}));

afterEach(cleanup);

const renderRoute = (next: ThreadTimeline) => {
  current.timeline = next;
  return render(
    <RegistryProvider>
      <ThreadRoute threadId="jam_sample" pane={undefined} />
    </RegistryProvider>,
  );
};

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="${name}"]`);

const clarify = rows.find((row) => row.type === "clarify");
const environment = rows.find((row) => row.type === "environment-request");
const messages = rows.filter(
  (row) => row.type === "user-message" || row.type === "agent-message",
);

describe("thread view composer slot", () => {
  it("shows the composer on a thread with nothing waiting", () => {
    const { container } = renderRoute(timeline({ rows: messages }));
    const composer = slot(container, "composer");
    expect(composer).not.toBeNull();
    expect(slot(container, "composer-footer")).not.toBeNull();
    expect(slot(container, "clarify-takeover")).toBeNull();
    expect(slot(container, "request-takeover")).toBeNull();
  });

  it("replaces the composer with the clarify takeover", () => {
    const { container, getByText } = renderRoute(
      timeline({ rows: messages, pendingAsk: clarify as never }),
    );
    expect(slot(container, "clarify-takeover")).not.toBeNull();
    expect(slot(container, "composer")).toBeNull();
    expect(getByText("Where should the toggle live?")).toBeDefined();
  });

  it("replaces the composer with the environment request takeover", () => {
    const { container, getByText } = renderRoute(
      timeline({
        rows: messages,
        pendingEnvironment: environment as never,
      }),
    );
    expect(slot(container, "request-takeover")).not.toBeNull();
    expect(slot(container, "composer")).toBeNull();
    expect(getByText("SAMPLE_API_KEY")).toBeDefined();
  });

  it("answers the newest request first", () => {
    const { container } = renderRoute(
      timeline({
        rows: messages,
        pendingAsk: clarify as never,
        pendingEnvironment: environment as never,
      }),
    );
    expect(slot(container, "request-takeover")).not.toBeNull();
    expect(slot(container, "clarify-takeover")).toBeNull();
  });

  it("shows the skeleton while the thread loads", () => {
    const { container } = renderRoute(timeline({ loading: true }));
    expect(slot(container, "skeleton-panel")).not.toBeNull();
    expect(slot(container, "thread-empty")).toBeNull();
  });

  it("shows the empty state once a thread with no rows has loaded", () => {
    const { container } = renderRoute(timeline());
    expect(slot(container, "thread-empty")).not.toBeNull();
    expect(slot(container, "skeleton-panel")).toBeNull();
  });

  it("shows the older-page spinner only while paging", () => {
    const { container } = renderRoute(
      timeline({ rows: messages, hasOlder: true, loadingOlder: true }),
    );
    expect(slot(container, "chat-loading-older")).not.toBeNull();
  });
});

describe("thread composer footer", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };

  it("renders the footer inside the composer host", () => {
    const { container } = renderRoute(timeline({ rows: messages }));
    const footer = slot(container, "composer-footer");
    const host = slot(container, "composer")?.parentElement;
    expect(host).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(host?.contains(footer)).toBe(true);
    expect(host?.lastElementChild).toBe(footer);
  });

  it("keeps the footer mounted when a takeover replaces the composer", () => {
    const { container } = renderRoute(
      timeline({ rows: messages, pendingAsk: clarify as never }),
    );
    expect(slot(container, "composer")).toBeNull();
    expect(slot(container, "clarify-takeover")).not.toBeNull();
    expect(slot(container, "composer-footer")).not.toBeNull();
  });

  it("feeds the footer the thread context meter when an org is present", () => {
    const { container } = render(
      <RegistryProvider>
        <ThreadView threadId="jam_sample" rows={messages} handlers={handlers} />
      </RegistryProvider>,
    );
    const meter = slot(container, "context-meter");
    expect(meter).not.toBeNull();
    expect(meter?.closest('[data-slot="composer-footer"]')).not.toBeNull();
    expect(meter?.getAttribute("data-org")).toBe("org_sample");
    expect(meter?.getAttribute("data-jam")).toBe("jam_sample");
  });
});
