import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type PreviewPull, PullPreview } from "@/components/pull-preview";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { ThreadPreview } from "./thread-preview";

afterEach(cleanup);

const renderAt = async (node: ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await router.load();
};

const pull = (n: number): PreviewPull =>
  ({
    id: `pr_${n}`,
    repo: "acme/web",
    number: n,
    title: `Change ${n}`,
    state: "ready",
    additions: 10,
    deletions: 2,
    author: "Alex Morgan",
    authorAvatarUrl: "",
    url: `https://example.com/acme/web/pull/${n}`,
  }) as PreviewPull;

const card = (overrides: Partial<ThreadCard> = {}) =>
  ({
    id: "jam_sample",
    title: "Ship the onboarding flow",
    status: "idle",
    archived: false,
    origin: "web",
    needsYou: false,
    ask: null,
    preview: null,
    personal: false,
    pulls: [],
    primaryMachine: { kind: "device", name: "workstation" },
    ...overrides,
  }) as unknown as ThreadCard;

describe("ThreadPreview", () => {
  it("renders the header, meta row and sections", async () => {
    await renderAt(
      <ThreadPreview
        thread={card({ crewCount: 1 } as Partial<ThreadCard>)}
        code="ACME-4"
        project={{ name: "Web" }}
        model={{ name: "Sample Model" }}
        issues={[
          { id: "i1", code: "ACME-1", title: "First" },
          { id: "i2", code: "ACME-2", title: "Second" },
          { id: "i3", code: "ACME-3", title: "Third" },
          { id: "i4", code: "ACME-5", title: "Fourth" },
        ]}
        tasks={[{ id: "t1", localIndex: 1, title: "Draft the copy" }]}
      />,
    );
    expect(screen.getByText("ACME-4")).toBeTruthy();
    expect(screen.getByText("Ship the onboarding flow")).toBeTruthy();
    expect(screen.getByText("workstation")).toBeTruthy();
    expect(screen.getByText("Sample Model")).toBeTruthy();
    expect(screen.getByText("Issues")).toBeTruthy();
    expect(screen.queryByText("Fourth")).toBeNull();
    fireEvent.click(screen.getByText("1 more"));
    expect(screen.getByText("Fourth")).toBeTruthy();
    expect(screen.getByText("Subagent 1")).toBeTruthy();
    expect(
      screen.getByText("Draft the copy").closest("a")?.getAttribute("href"),
    ).toBe("/thread/jam_sample?pane=task%3At1");
  });

  it("labels captains and threads without a code", async () => {
    await renderAt(
      <ThreadPreview
        thread={card({ title: null, crewCount: 0 } as Partial<ThreadCard>)}
      />,
    );
    expect(screen.getByText("Captain")).toBeTruthy();
    expect(screen.getByText("Untitled thread")).toBeTruthy();
  });

  it("opens subagents through onOpenTask and pulls through onOpenPr", async () => {
    const onOpenTask = vi.fn();
    const onOpenPr = vi.fn();
    await renderAt(
      <ThreadPreview
        thread={card({ pulls: [pull(7)] as unknown as ThreadCard["pulls"] })}
        tasks={[{ id: "t1", localIndex: null, title: null }]}
        onOpenTask={onOpenTask}
        onOpenPr={onOpenPr}
      />,
    );
    fireEvent.click(screen.getByText("Untitled subagent"));
    expect(onOpenTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );
    fireEvent.click(screen.getByText("Change 7"));
    expect(onOpenPr).toHaveBeenCalledWith({
      repo: "acme/web",
      number: 7,
      url: "https://example.com/acme/web/pull/7",
    });
    fireEvent.click(screen.getByText("Change 7"), { metaKey: true });
    expect(onOpenPr).toHaveBeenCalledTimes(1);
  });

  it("shows the ask under the title when the thread needs you", async () => {
    await renderAt(
      <ThreadPreview
        thread={card({
          needsYou: true,
          status: "waiting",
          ask: { key: "k" },
          preview: "Can I merge this?",
        })}
      />,
    );
    expect(screen.getByText("Can I merge this?")).toBeTruthy();
  });
});

describe("PullPreview", () => {
  it("links each pull and labels the repo when multirepo", async () => {
    await renderAt(<PullPreview prs={[pull(3)]} multirepo />);
    expect(screen.getByText("web#3")).toBeTruthy();
    expect(screen.getByText("+10")).toBeTruthy();
    expect(screen.getByText("-2")).toBeTruthy();
    expect(screen.getByLabelText("Alex Morgan").textContent).toBe("AM");
    expect(
      screen.getByText("Change 3").closest("a")?.getAttribute("href"),
    ).toBe("/pull/acme/web/3");
  });
});
