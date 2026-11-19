import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emptySession,
  openTab,
  sessionGroups,
  splitTab,
  tabsInGroup,
} from "@/features/thread/thread-view/pane-session";
import type { PaneTab } from "@/features/thread-panes/tab-strip";
import { RightPanelGroup } from "@/primitives/right-panel";
import { ThreadDock } from "./thread-dock";

afterEach(cleanup);

const overview: PaneTab = { kind: "overview" };
const pr: PaneTab = {
  kind: "pr",
  number: 435,
  url: "https://github.com/keyurbodar/kiki/pull/435",
};
const issue: PaneTab = { kind: "issue", code: "AMA-175" };

const groupsOf = (session: ReturnType<typeof openTab>) =>
  sessionGroups(session).map((id) => ({
    id,
    tabs: tabsInGroup(session, id),
    activeId: session.activeIn[id] ?? null,
  }));

const dock = (session: ReturnType<typeof openTab>, props = {}) => (
  <RightPanelGroup>
    <div>chat</div>
    <ThreadDock
      threadId="jam_sample_0001"
      tiles={session.tiles}
      groups={groupsOf(session)}
      title="Retry the release"
      onSelectTab={() => undefined}
      renderPane={(tab) => <div data-slot="pane-stub" data-tab={tab.kind} />}
      {...props}
    />
  </RightPanelGroup>
);

const twoPanes = () =>
  splitTab(openTab(openTab(emptySession, pr), issue), "issue:AMA-175", "right");

describe("ThreadDock", () => {
  it("renders the panel inside the group the thread view provides", () => {
    render(dock(openTab(emptySession, overview)));
    const group = document.querySelector("[data-slot=right-panel-group]");
    const panel = document.querySelector("[data-slot=right-panel]");
    expect(group).not.toBeNull();
    expect(group?.contains(panel as Node)).toBe(true);
    expect(panel?.getAttribute("data-state")).toBe("open");
  });

  it("stays the desktop dock, never the phone's over-the-transcript host", () => {
    render(dock(openTab(emptySession, overview)));
    const panel = document.querySelector("[data-slot=right-panel]");
    expect(panel?.className ?? "").not.toContain("max-md:absolute");
    expect(panel?.className ?? "").not.toContain("max-md:top-");
  });

  it("carries the open pane tabs in its own bar", () => {
    render(dock(openTab(openTab(emptySession, pr), issue)));
    const bar = document.querySelector("[data-slot=thread-dock-header]");
    expect(bar?.querySelectorAll("[data-pane-tab]")).toHaveLength(2);
    expect(
      document.querySelector('[data-pane-tab="issue:AMA-175"] [data-selected]'),
    ).not.toBeNull();
  });

  it("closes to a zero-width panel when no pane is open", () => {
    render(dock(emptySession));
    expect(
      document
        .querySelector("[data-slot=right-panel]")
        ?.getAttribute("data-state"),
    ).toBe("closed");
  });

  it("offers expand and close from the bar, and no link control Capy does not have", () => {
    const onToggleExpand = vi.fn();
    const onCloseTab = vi.fn();
    render(
      dock(openTab(emptySession, overview), { onToggleExpand, onCloseTab }),
    );
    expect(screen.queryByLabelText("Copy pane link")).toBeNull();
    fireEvent.click(screen.getByLabelText("Expand pane"));
    fireEvent.click(screen.getByLabelText("Close pane"));
    expect(onToggleExpand).toHaveBeenCalled();
    expect(onCloseTab).toHaveBeenCalledWith("overview");
  });

  it("draws a strip and a pane per group, with one divider between them", () => {
    render(dock(twoPanes()));
    expect(
      document.querySelectorAll("[data-slot=thread-dock-header]"),
    ).toHaveLength(2);
    expect(document.querySelectorAll("[data-tile-group]")).toHaveLength(2);
    expect(document.querySelectorAll("[data-slot=tile-divider]")).toHaveLength(
      1,
    );
    expect(
      document
        .querySelector('[data-tile-group="group:1"] [data-slot=pane-stub]')
        ?.getAttribute("data-tab"),
    ).toBe("issue");
  });

  it("leaves the split rows out when the dock cannot split, as below md", () => {
    render(dock(openTab(openTab(emptySession, pr), issue)));
    fireEvent.contextMenu(screen.getByText("AMA-175"), { button: 2 });
    expect(screen.queryByText("Split right")).toBeNull();
  });

  it("offers the split rows when the dock can split", () => {
    const onSplitTab = vi.fn();
    render(dock(openTab(openTab(emptySession, pr), issue), { onSplitTab }));
    fireEvent.contextMenu(screen.getByText("AMA-175"), { button: 2 });
    fireEvent.click(screen.getByText("Split right"));
    expect(onSplitTab).toHaveBeenCalledWith("issue:AMA-175", "right");
  });

  it("nudges the divider from the keyboard and reports the new ratio", () => {
    const onRatio = vi.fn();
    render(dock(twoPanes(), { onRatio }));
    fireEvent.keyDown(screen.getByLabelText("Resize panes side by side"), {
      key: "ArrowRight",
    });
    expect(onRatio).toHaveBeenCalledWith("", 0.52);
  });

  it("keeps a pane's content mounted while the divider moves", () => {
    const { rerender } = render(dock(twoPanes()));
    const before = document.querySelector(
      '[data-tile-group="group:1"] [data-slot=pane-stub]',
    );
    rerender(dock(twoPanes(), { onRatio: () => undefined }));
    const after = document.querySelector(
      '[data-tile-group="group:1"] [data-slot=pane-stub]',
    );
    expect(after).toBe(before);
  });
});
