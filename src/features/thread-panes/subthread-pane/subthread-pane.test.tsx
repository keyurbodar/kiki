import { RegistryProvider, useAtom } from "@effect/atom-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMessageActions } from "@/features/thread/message-footer";
import { pendingReplyAtom } from "@/features/thread/reply-quote";
import { SubthreadPane } from "./subthread-pane";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: unknown }) => (
    <span>{children as never}</span>
  ),
  useNavigate: () => navigate,
}));

vi.mock("@/features/thread/timeline", async () => {
  const { Atom } = await import("effect/reactivity");
  return {
    useThreadTimeline: () => ({
      rows: [{ type: "user-message", id: "row_1" }],
      gaps: new Map(),
      pendingAsk: undefined,
      pendingEnvironment: undefined,
      queued: [],
      turnOpen: false,
      live: { phase: "idle" },
      loading: false,
      failed: false,
      retry: () => undefined,
      loadingOlder: false,
      hasOlder: false,
      loadOlder: () => undefined,
    }),
    threadKey: (orgId: string, jamId: string) => `${orgId}/${jamId}`,
    viewedVersionAtom: Atom.family((_key: string) => Atom.make(null)),
  };
});

vi.mock("@/features/thread/jam-chat", () => ({
  JamChat: () => {
    const actions = useMessageActions();
    return (
      <button
        type="button"
        onClick={() =>
          actions.reply?.({
            eventId: "01M7PK3X2N00000000000000W5",
            rowId: "row_1",
            section: 0,
            name: "Yuzu",
            text: "the retry budget is per attempt",
          })
        }
      >
        Reply
      </button>
    );
  },
}));

afterEach(cleanup);

const target = {
  eventId: "01M7PK3X2N00000000000000W5",
  rowId: "row_1",
  section: 0,
  name: "Yuzu",
  text: "the retry budget is per attempt",
};

const PendingReply = () => {
  const [pending] = useAtom(pendingReplyAtom("jam_child"));
  return <span data-slot="pending">{pending?.text ?? "none"}</span>;
};

describe("SubthreadPane reply", () => {
  const renderPane = () =>
    render(
      <RegistryProvider>
        <SubthreadPane
          orgId={"org_sample" as never}
          jamId={"jam_child" as never}
          label="Side thread"
        />
        <PendingReply />
      </RegistryProvider>,
    );

  it("opens the thread it reads, with the quote waiting for its composer", () => {
    renderPane();
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(navigate).toHaveBeenCalledWith({
      to: "/thread/$threadId",
      params: { threadId: "jam_child" },
    });
    expect(document.querySelector('[data-slot="pending"]')?.textContent).toBe(
      target.text,
    );
  });
});
