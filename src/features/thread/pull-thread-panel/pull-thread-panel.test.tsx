import { RegistryProvider } from "@effect/atom-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RightPanelHost } from "@/features/shell/right-panel-host";
import { PullThreadPanel, PullThreadPanelTrigger } from "./pull-thread-panel";
import type { PanelPull, PullPanelSelection } from "./selection";

afterEach(cleanup);

const pull: PanelPull = {
  id: "pr_sample_128",
  number: 128,
  title: "Add dark mode to settings",
  repo: "acme/web",
  headRef: "feat/dark-mode",
  projectId: "proj_sample_web",
  threadId: null,
};

const renderPanel = (
  selection: PullPanelSelection,
  handlers: {
    onClose?: () => void;
    onSelectThread?: (id: string) => void;
  } = {},
) =>
  render(
    <RegistryProvider>
      <RightPanelHost storageKey={null}>
        <PullThreadPanel
          selection={selection}
          pull={pull}
          onClose={handlers.onClose ?? vi.fn()}
          onSelectThread={handlers.onSelectThread ?? vi.fn()}
          onOpenChat={vi.fn()}
          renderThread={(jamId) => <p>thread {jamId}</p>}
        />
      </RightPanelHost>
    </RegistryProvider>,
  );

describe("PullThreadPanel", () => {
  it("stays closed with nothing selected", () => {
    const { container } = renderPanel(null);
    expect(
      container
        .querySelector("[data-slot=right-panel]")
        ?.getAttribute("data-state"),
    ).toBe("closed");
  });

  it("hosts the selected thread", () => {
    renderPanel({ kind: "thread", jamId: "jam_1" });
    expect(screen.getByText("thread jam_1")).toBeTruthy();
  });

  it("offers a chat about the pull", () => {
    const onClose = vi.fn();
    renderPanel({ kind: "chat" }, { onClose });
    expect(screen.getByText("Chat with Capy")).toBeTruthy();
    expect(
      screen.getByText("Chat with Capy about this pull request"),
    ).toBeTruthy();
    expect(screen.getByText("web#128")).toBeTruthy();
    const input = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Message",
    });
    expect(input.value).toBe("@#128 Add dark mode to settings ");
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("starts a thread from the chat and selects it", async () => {
    const onSelectThread = vi.fn();
    renderPanel({ kind: "chat" }, { onSelectThread });
    const input = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Message",
    });
    await waitFor(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSelectThread).toHaveBeenCalled();
    });
    expect(onSelectThread.mock.calls[0]?.[0]).toMatch(/^jam/);
  });
});

describe("PullThreadPanelTrigger", () => {
  it("opens the panel on the pull's thread or chat", async () => {
    const onOpen = vi.fn();
    render(
      <RegistryProvider>
        <PullThreadPanelTrigger pull={pull} open={false} onOpen={onOpen} />
      </RegistryProvider>,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Open thread panel" }),
    );
    expect(onOpen).toHaveBeenCalledOnce();
    expect(["thread", "chat"]).toContain(onOpen.mock.calls[0]?.[0]?.kind);
  });

  it("hides while the panel is open", () => {
    const { container } = render(
      <RegistryProvider>
        <PullThreadPanelTrigger pull={pull} open onOpen={vi.fn()} />
      </RegistryProvider>,
    );
    expect(container.innerHTML).toBe("");
  });
});
