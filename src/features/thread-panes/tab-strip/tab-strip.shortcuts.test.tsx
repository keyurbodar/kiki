import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isMacPlatform } from "./shortcut";
import { TabStrip } from "./tab-strip";

afterEach(cleanup);

/** The strip prints `mod` as ⌘ on a Mac and Ctrl elsewhere, so press that one. */
const mod = () => (isMacPlatform() ? { metaKey: true } : { ctrlKey: true });

const press = (key: string, extra: Record<string, boolean> = {}) =>
  fireEvent.keyDown(document, { key, ...mod(), ...extra });

const tabs = [
  { kind: "overview" } as const,
  { kind: "captain_issues" } as const,
];

describe("TabStrip shortcuts", () => {
  it("closes the tab the strip prints the close shortcut beside", () => {
    const onCloseTab = vi.fn();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        closeShortcutTarget="captain_issues"
        onCloseTab={onCloseTab}
      />,
    );
    press("w");
    expect(onCloseTab).toHaveBeenCalledWith("captain_issues");
  });

  it("closes the active tab when no close target is named, and never the chat tab", () => {
    const onCloseTab = vi.fn();
    const { unmount } = render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onCloseTab={onCloseTab}
      />,
    );
    press("w");
    expect(onCloseTab).toHaveBeenCalledWith("overview");
    unmount();

    onCloseTab.mockClear();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId={null}
        chatTab={{ title: "Chat", content: null, onSelect: vi.fn() }}
        closeShortcutTarget="chat"
        onCloseTab={onCloseTab}
      />,
    );
    press("w");
    expect(onCloseTab).not.toHaveBeenCalled();
  });

  it("reopens a closed tab, and leaves the key alone when the strip cannot", () => {
    const onReopenTab = vi.fn();
    const { unmount } = render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onReopenTab={onReopenTab}
      />,
    );
    press("t", { shiftKey: true });
    expect(onReopenTab).toHaveBeenCalledTimes(1);
    unmount();

    render(<TabStrip threadId="jam_1" tabs={tabs} activeId="overview" />);
    const event = new KeyboardEvent("keydown", {
      key: "t",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      ...mod(),
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("steps to the next and previous pane tab, wrapping through the chat tab", () => {
    const onSelectTab = vi.fn();
    const onChatSelect = vi.fn();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        chatTab={{ title: "Chat", content: null, onSelect: onChatSelect }}
        onSelectTab={onSelectTab}
      />,
    );
    press("ArrowRight", { shiftKey: true, altKey: true });
    expect(onSelectTab).toHaveBeenCalledWith("captain_issues");

    press("ArrowLeft", { shiftKey: true, altKey: true });
    expect(onChatSelect).toHaveBeenCalledTimes(1);
  });

  it("opens the browser and a side thread from the keys the menus print", () => {
    const onOpenBrowser = vi.fn();
    const onNewSideThread = vi.fn();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onOpenBrowser={onOpenBrowser}
        menu={{
          openIds: new Set(),
          onOpen: vi.fn(),
          onOpenBrowser,
          onNewSideThread,
        }}
      />,
    );
    press("l", { shiftKey: true });
    expect(onOpenBrowser).toHaveBeenCalledTimes(1);
    press("s", { shiftKey: true });
    expect(onNewSideThread).toHaveBeenCalledTimes(1);
  });

  it("keeps out of the way of typing", () => {
    const onCloseTab = vi.fn();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onCloseTab={onCloseTab}
      />,
    );
    const input = document.createElement("input");
    document.body.append(input);
    fireEvent.keyDown(input, { key: "w", ...mod() });
    expect(onCloseTab).not.toHaveBeenCalled();
    input.remove();
  });
});
