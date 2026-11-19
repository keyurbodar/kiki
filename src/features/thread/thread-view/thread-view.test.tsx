import { RegistryProvider, useAtomSet } from "@effect/atom-react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Schema } from "effect";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeThreadFixtures, TimelineRow } from "@/data/events";
import { branches, orgId, threads } from "@/data/mocks/fixtures/world";
import type { ReplyTarget } from "@/features/thread/message-footer";
import { pendingReplyAtom } from "@/features/thread/reply-quote";
import { ThreadRoute } from "@/features/thread/thread-route/thread-route";
import {
  type EditDraft,
  editDraftAtom,
  type ThreadTimeline,
} from "@/features/thread/timeline";
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
  failed: false,
  retry: () => undefined,
  loadingOlder: false,
  hasOlder: false,
  loadOlder: () => undefined,
  ...overrides,
});

const sends = vi.hoisted(() => [] as Array<{ text: string }>);
const refreshed = vi.hoisted(() => [] as string[]);

vi.mock("@/features/thread/use-composer-send", () => ({
  useComposerSend: () => (payload: { text: string }) => {
    sends.push(payload);
    return true;
  },
}));

vi.mock("@/features/composer/context-meter", () => ({
  ContextMeter: ({ orgId, jamId }: { orgId: string; jamId: string }) => (
    <div data-slot="context-meter" data-org={orgId} data-jam={jamId} />
  ),
}));

const current = vi.hoisted(() => ({
  timeline: undefined as unknown as ThreadTimeline,
}));

vi.mock("@/features/thread/timeline", async () => {
  const { Atom } = await import("effect/reactivity");
  return {
    useThreadTimeline: () => current.timeline,
    threadKey: (orgId: string, jamId: string) => `${orgId}/${jamId}`,
    editDraftAtom: Atom.family((_key: string) => Atom.make(null)),
    viewedVersionAtom: Atom.family((_key: string) => Atom.make(null)),
    appendPendingAtom: Atom.family((_key: string) => Atom.make(null)),
    removePendingAtom: Atom.family((_key: string) => Atom.make(null)),
    refreshNewestAtom: Atom.family((_key: string) =>
      Atom.writable(
        () => undefined,
        () => {
          refreshed.push("newest");
        },
      ),
    ),
    idleRefreshNewestAtom: Atom.writable(
      () => undefined,
      () => undefined,
    ),
  };
});

afterEach(cleanup);

const startEdit = vi.hoisted(() => ({
  set: (_draft: EditDraft | null): void => undefined,
}));

const DraftSetter = () => {
  startEdit.set = useAtomSet(editDraftAtom(`${orgId}/jam_sample`));
  return null;
};

const renderRoute = (next: ThreadTimeline, threadId = "jam_sample") => {
  current.timeline = next;
  return render(
    <RegistryProvider>
      <ThreadRoute threadId={threadId} pane={undefined} />
      <DraftSetter />
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

/** happy-dom's DragEvent drops its `dataTransfer` init, so the handlers get the fields they read. */
const dragOver = (target: EventTarget) => {
  const event = new Event("dragenter", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      types: ["Files"],
      files: [new File(["#"], "capy-shot.png", { type: "image/png" })],
      dropEffect: "none",
    },
  });
  target.dispatchEvent(event);
};

describe("thread view composer slot", () => {
  it("shows the composer on a thread with nothing waiting", () => {
    const { container } = renderRoute(timeline({ rows: messages }));
    const composer = slot(container, "composer");
    expect(composer).not.toBeNull();
    expect(slot(container, "composer-footer")).not.toBeNull();
    expect(slot(container, "clarify-takeover")).toBeNull();
    expect(slot(container, "request-takeover")).toBeNull();
  });

  it("shows the + menu and the send control before the first character", () => {
    renderRoute(timeline({ rows: messages }));
    expect(screen.getByRole("button", { name: "Add to message" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy();
  });

  it("takes files dragged onto the thread's composer", async () => {
    const { container } = renderRoute(timeline({ rows: messages }));
    dragOver(slot(container, "composer") as HTMLElement);
    await waitFor(() =>
      expect(document.body.textContent).toContain("Drop files to attach"),
    );
  });

  it("replaces the composer with the clarify takeover", () => {
    const { container, getByText } = renderRoute(
      timeline({ rows: messages, pendingAsk: clarify as never }),
    );
    expect(slot(container, "clarify-takeover")).not.toBeNull();
    expect(slot(container, "composer")).toBeNull();
    expect(getByText("Where should the toggle live?")).toBeDefined();
  });

  it("sends the picked clarify option through the thread route", () => {
    sends.length = 0;
    const { getByText } = renderRoute(
      timeline({ rows: messages, pendingAsk: clarify as never }),
    );
    fireEvent.click(getByText("Top bar"));
    expect(sends).toHaveLength(1);
    expect(sends[0]?.text).toContain("Where should the toggle live?");
    expect(sends[0]?.text).toContain("Top bar");
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

  it("gives an edit draft the slot while a takeover is pending", async () => {
    const { container } = renderRoute(
      timeline({ rows: messages, pendingAsk: clarify as never }),
    );
    expect(slot(container, "clarify-takeover")).not.toBeNull();
    const sent = rows.find(
      (row) => row.type === "user-message" && row.state === "answered",
    ) as Extract<(typeof rows)[number], { type: "user-message" }>;
    await act(async () =>
      startEdit.set({
        rowId: sent.id,
        eventId: sent.eventId as string,
        text: sent.text,
      } as never),
    );
    await waitFor(() => expect(slot(container, "composer")).not.toBeNull());
    expect(slot(container, "clarify-takeover")).toBeNull();
    expect(screen.getByText("Editing message")).toBeTruthy();
  });

  it("shows the skeleton while the thread loads", () => {
    const { container } = renderRoute(timeline({ loading: true }));
    expect(slot(container, "skeleton-panel")).not.toBeNull();
    expect(slot(container, "thread-empty")).toBeNull();
  });

  it("shows Capy's failure state instead of a skeleton when the read fails", () => {
    const retry = vi.fn();
    const { container, getByRole, getByText } = renderRoute(
      timeline({ failed: true, retry }),
    );
    expect(slot(container, "thread-load-failed")).not.toBeNull();
    expect(slot(container, "skeleton-panel")).toBeNull();
    expect(slot(container, "thread-empty")).toBeNull();
    expect(getByText("Couldn't load this conversation")).toBeDefined();
    fireEvent.click(getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
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

describe("thread composer chrome", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };

  const renderView = (threadId: string) =>
    render(
      <RegistryProvider>
        <ThreadView threadId={threadId} rows={messages} handlers={handlers} />
      </RegistryProvider>,
    );

  it("mounts the model picker in the thread's composer", () => {
    const { container } = renderView(threads.checkoutTest.id);
    const trigger = screen.getByLabelText("Model");
    expect(slot(container, "composer")?.contains(trigger)).toBe(true);
    expect(trigger.getAttribute("aria-keyshortcuts")).toBe("Alt+/");
  });

  it("shows the thread's branch in the footer and copies it on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const branch = branches[1];
    const { container } = renderView(threads.checkoutTest.id);
    const chip = await screen.findByLabelText(`Copy ${branch}`);
    expect(chip.closest('[data-slot="composer-footer"]')).not.toBeNull();
    fireEvent.click(chip);
    expect(writeText).toHaveBeenCalledWith(branch);
    expect(slot(container, "composer")).not.toBeNull();
  });
});

describe("thread composer stop control", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };

  const renderView = (turnOpen: boolean) =>
    render(
      <RegistryProvider>
        <ThreadView
          threadId={threads.checkoutTest.id}
          rows={messages}
          running={turnOpen}
          handlers={handlers}
        />
      </RegistryProvider>,
    );

  afterEach(() => {
    refreshed.length = 0;
  });

  it("swaps the send control for stop while a run is in flight", () => {
    const running = renderView(true);
    expect(screen.getByRole("button", { name: "Stop run" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    running.unmount();

    renderView(false);
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Stop run" })).toBeNull();
  });

  it("stops the run from the control and reads the newest events", async () => {
    renderView(true);
    fireEvent.click(screen.getByRole("button", { name: "Stop run" }));
    await waitFor(() => expect(refreshed.length).toBe(1));
  });

  it("binds the shortcut to the same stop while a run is in flight", async () => {
    renderView(true);
    fireEvent.keyDown(window, { key: ".", code: "Period", ctrlKey: true });
    await waitFor(() => expect(refreshed.length).toBe(1));
  });

  it("leaves the shortcut unbound when nothing is running", async () => {
    renderView(false);
    fireEvent.keyDown(window, { key: ".", code: "Period", ctrlKey: true });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(refreshed).toEqual([]);
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
    const host = footer?.parentElement;
    expect(host).not.toBeNull();
    expect(slot(container, "composer")).not.toBeNull();
    expect(host?.contains(slot(container, "composer"))).toBe(true);
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

describe("thread chat column", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };

  const chatColumn = (container: HTMLElement) =>
    container.querySelector<HTMLElement>("[data-slot=right-panel-group]")
      ?.firstElementChild as HTMLElement;

  const renderView = (dock: ReactNode) =>
    render(
      <RegistryProvider>
        <ThreadView
          threadId="jam_sample"
          rows={messages}
          handlers={handlers}
          dock={dock}
        />
      </RegistryProvider>,
    );

  it("takes the pane's width from the token, with no fallback", () => {
    const { container } = renderView(<div data-slot="pane-stub" />);
    const { className } = chatColumn(container);
    expect(className).toContain("var(--right-panel-width)");
    expect(className).not.toContain("var(--right-panel-width,");
  });

  it("fills the container when no pane is open", () => {
    const { container } = renderView(undefined);
    expect(chatColumn(container).className).toContain("w-full");
  });
});

describe("editing a sent message", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };
  const sent = rows.find(
    (row) => row.type === "user-message" && row.state === "answered",
  ) as Extract<(typeof rows)[number], { type: "user-message" }>;
  const target = {
    rowId: sent.id,
    eventId: sent.eventId as string,
    text: sent.text,
  };

  const field = (container: HTMLElement) =>
    container.querySelector("[contenteditable]") as HTMLElement | null;

  const renderEditing = (onCancelEdit = () => undefined) =>
    render(
      <RegistryProvider>
        <ThreadView
          threadId="jam_sample"
          rows={messages}
          handlers={handlers}
          editing={target as never}
          onCancelEdit={onCancelEdit}
        />
      </RegistryProvider>,
    );

  it("holds the edited text in the composer and shows the editing bar", async () => {
    const { container } = renderEditing();
    await waitFor(() => expect(field(container)).not.toBeNull());
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").toContain(sent.text),
    );
    expect(screen.getByText("Editing message")).toBeTruthy();
    expect(screen.getByLabelText("Cancel editing")).toBeTruthy();
  });

  it("leaves edit mode from the cancel button and restores the draft", async () => {
    const onCancelEdit = vi.fn();
    const { container } = renderEditing(onCancelEdit);
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").not.toBe(""),
    );
    fireEvent.click(screen.getByLabelText("Cancel editing"));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(field(container)?.textContent ?? "").toBe(""));
  });

  it("draws the editing bar even when a custom composer is mounted", () => {
    const onCancelEdit = vi.fn();
    render(
      <RegistryProvider>
        <ThreadView
          threadId="jam_sample"
          rows={messages}
          handlers={handlers}
          editing={target as never}
          onCancelEdit={onCancelEdit}
          composer={<textarea aria-label="custom composer" />}
        />
      </RegistryProvider>,
    );
    expect(screen.getByText("Editing message")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Cancel editing"));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("leaves edit mode on Escape", async () => {
    const onCancelEdit = vi.fn();
    const { container } = renderEditing(onCancelEdit);
    await waitFor(() => expect(field(container)).not.toBeNull());
    fireEvent.keyDown(field(container) as HTMLElement, { key: "Escape" });
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("opens from the thread screen's edit draft and closes it again", async () => {
    const { container } = renderRoute(timeline({ rows: messages }));
    await waitFor(() => expect(field(container)).not.toBeNull());
    await act(async () =>
      startEdit.set({ ...target, eventId: target.eventId } as never),
    );
    await waitFor(() =>
      expect(screen.getByText("Editing message")).toBeTruthy(),
    );
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").toContain(sent.text),
    );
    fireEvent.keyDown(field(container) as HTMLElement, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByText("Editing message")).toBeNull(),
    );
  });
});

const pending: { set: (target: ReplyTarget) => void } = {
  set: () => undefined,
};

const ReplySetter = () => {
  pending.set = useAtomSet(pendingReplyAtom("jam_sample"));
  return null;
};

describe("replying to a message", () => {
  const handlers = {
    orgId: "org_sample",
    parentJamId: null,
    onClarifySubmit: () => undefined,
  };

  const sent = rows.find((row) => row.type === "user-message") as Extract<
    (typeof rows)[number],
    { type: "user-message" }
  >;
  const target = {
    eventId: sent.eventId as string,
    rowId: sent.id,
    section: 0,
    name: "Keyur",
    text: "a dark mode toggle",
  };

  const field = (container: HTMLElement) =>
    container.querySelector("[contenteditable]") as HTMLElement | null;

  pending.set = () => undefined;
  it("takes the target a side thread's Reply handed over", async () => {
    const { container } = render(
      <RegistryProvider>
        <ThreadView threadId="jam_sample" rows={messages} handlers={handlers} />
        <ReplySetter />
      </RegistryProvider>,
    );
    await waitFor(() => expect(field(container)).not.toBeNull());
    await act(async () => pending.set(target));
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").toContain(target.text),
    );
    expect(screen.getByText("Replying to")).toBeTruthy();
  });

  it("takes the excerpt back out on Cancel", async () => {
    const { container } = render(
      <RegistryProvider>
        <ThreadView threadId="jam_sample" rows={messages} handlers={handlers} />
        <ReplySetter />
      </RegistryProvider>,
    );
    await waitFor(() => expect(field(container)).not.toBeNull());
    await act(async () => pending.set(target));
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").toContain(target.text),
    );
    fireEvent.click(screen.getByLabelText("Cancel reply"));
    await waitFor(() =>
      expect(field(container)?.textContent ?? "").not.toContain(target.text),
    );
    expect(screen.queryByText("Replying to")).toBeNull();
  });
});
