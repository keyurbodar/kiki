import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RightPanelGroup } from "@/primitives/right-panel";
import type { PaneTab } from "@/features/thread-panes/tab-strip";
import { ThreadDock } from "./thread-dock";

afterEach(cleanup);

const tabs: readonly PaneTab[] = [
  { kind: "overview" },
  { kind: "files", threadId: "jam_sample_0001" },
] as unknown as readonly PaneTab[];

const renderDock = (pane: React.ReactNode) =>
  render(
    <RightPanelGroup>
      <div>chat</div>
      <ThreadDock
        threadId="jam_sample_0001"
        tabs={tabs}
        activeId="overview"
        title="Retry the release"
        onSelectTab={() => undefined}
      >
        {pane}
      </ThreadDock>
    </RightPanelGroup>,
  );

describe("ThreadDock", () => {
  it("renders the panel inside the group the thread view provides", () => {
    renderDock(<div data-slot="pane-stub" />);
    const group = document.querySelector("[data-slot=right-panel-group]");
    const panel = document.querySelector("[data-slot=right-panel]");
    expect(group).not.toBeNull();
    expect(group?.contains(panel as Node)).toBe(true);
    expect(panel?.getAttribute("data-state")).toBe("open");
  });

  it("carries the open pane tabs in its own bar", () => {
    renderDock(<div data-slot="pane-stub" />);
    const bar = document.querySelector("[data-slot=thread-dock-header]");
    expect(
      bar?.querySelectorAll("[data-pane-tab]").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      document.querySelector('[data-pane-tab="overview"] [data-selected]'),
    ).not.toBeNull();
  });

  it("closes to a zero-width panel when no pane is open", () => {
    renderDock(undefined);
    expect(
      document
        .querySelector("[data-slot=right-panel]")
        ?.getAttribute("data-state"),
    ).toBe("closed");
  });

  it("offers the pane's link, expand and close from the bar", () => {
    const onCopyLink = vi.fn();
    const onToggleExpand = vi.fn();
    const onClose = vi.fn();
    render(
      <RightPanelGroup>
        <ThreadDock
          threadId="jam_sample_0001"
          tabs={tabs}
          activeId="overview"
          onSelectTab={() => undefined}
          onCopyLink={onCopyLink}
          onToggleExpand={onToggleExpand}
          onClose={onClose}
        >
          <div data-slot="pane-stub" />
        </ThreadDock>
      </RightPanelGroup>,
    );
    fireEvent.click(screen.getByLabelText("Copy pane link"));
    fireEvent.click(screen.getByLabelText("Expand pane"));
    fireEvent.click(screen.getByLabelText("Close pane"));
    expect(onCopyLink).toHaveBeenCalledWith(
      expect.stringContaining("/thread/jam_sample_0001"),
    );
    expect(onToggleExpand).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
