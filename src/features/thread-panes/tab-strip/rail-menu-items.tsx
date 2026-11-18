import { MenuCheckboxItem, MenuItem, MenuSeparator } from "@/primitives/menu";
import { toast } from "@/primitives/toaster";
import { menuIcon, menuTrailing } from "./classes";
import {
  ArrowLeftGlyph,
  ArrowRightGlyph,
  BrowserTabsGlyph,
  CrossGlyph,
  LinkGlyph,
  SplitDownGlyph,
  SplitRightGlyph,
  UndoGlyph,
} from "./glyphs";
import { shortcutFor } from "./shortcut";
import {
  CHAT_TAB_ID,
  closeTargets,
  cycleTabId,
  type RailTab,
  tabLink,
} from "./tabs";

export type SplitDirection = "right" | "bottom";

export type RailMenuItemsProps = {
  /** The tab the menu opened on, or null for the strip background. */
  target: string | null;
  /** Whether the target is the tab the close shortcut acts on. */
  current: boolean;
  railTabs: readonly RailTab[];
  activeId: string | null;
  threadId: string;
  autoClose: boolean;
  onAutoCloseChange: (autoClose: boolean) => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onCloseMany: (ids: readonly string[], keep: string | undefined) => void;
  onReopen?: () => void;
  onSplit?: (id: string, direction: SplitDirection) => void;
};

/** Copies an absolute link and confirms it in a toast. */
export function copyLink(path: string) {
  const url = `${window.location.origin}${path}`;
  navigator.clipboard.writeText(url).then(
    () => toast.success("Link copied", { description: url }),
    () => toast.error("Could not copy link"),
  );
}

/** The strip's right-click items: close, split, reopen, copy link, cycle. */
export function RailMenuItems({
  target,
  current,
  railTabs,
  activeId,
  threadId,
  autoClose,
  onAutoCloseChange,
  onSelect,
  onClose,
  onCloseMany,
  onReopen,
  onSplit,
}: RailMenuItemsProps) {
  const {
    closable,
    target: entry,
    others,
    toRight,
  } = closeTargets(railTabs, target);
  const cycle = (step: number) => {
    const next = cycleTabId(railTabs, activeId, step);
    if (next !== undefined) onSelect(next);
  };
  const owner = (part: string) =>
    `features/thread/pane/tab-strip.tsx#RailMenuItems:${part}`;

  return (
    <>
      {entry !== undefined && closable.includes(entry.id) && (
        <MenuItem
          data-track-owner={owner("MenuItem.1")}
          onClick={() => onClose(entry.id)}
        >
          <span className={menuIcon}>
            <CrossGlyph />
          </span>
          <span>Close</span>
          {current && (
            <span className={menuTrailing}>{shortcutFor("tab.close")}</span>
          )}
        </MenuItem>
      )}
      {entry !== undefined && (
        <>
          <MenuItem
            data-track-owner={owner("MenuItem.2")}
            disabled={others.length === 0}
            onClick={() => onCloseMany(others, entry.id)}
          >
            <span className={menuIcon}>
              <BrowserTabsGlyph />
            </span>
            <span>Close others</span>
          </MenuItem>
          <MenuItem
            data-track-owner={owner("MenuItem.3")}
            disabled={toRight.length === 0}
            onClick={() => onCloseMany(toRight, undefined)}
          >
            <span className={menuIcon}>
              <BrowserTabsGlyph />
            </span>
            <span>Close tabs to the right</span>
          </MenuItem>
        </>
      )}
      <MenuItem
        data-track-owner={owner("MenuItem.4")}
        disabled={closable.length === 0}
        onClick={() => onCloseMany(closable, undefined)}
      >
        <span className={menuIcon}>
          <BrowserTabsGlyph />
        </span>
        <span>Close all</span>
      </MenuItem>
      {entry !== undefined &&
        onSplit !== undefined &&
        (closable.includes(entry.id) || entry.id === CHAT_TAB_ID) && (
          <>
            <MenuSeparator />
            <MenuItem
              data-track-owner={owner("MenuItem.5")}
              onClick={() => onSplit(entry.id, "right")}
            >
              <span className={menuIcon}>
                <SplitRightGlyph />
              </span>
              <span>Split right</span>
            </MenuItem>
            <MenuItem
              data-track-owner={owner("MenuItem.6")}
              onClick={() => onSplit(entry.id, "bottom")}
            >
              <span className={menuIcon}>
                <SplitDownGlyph />
              </span>
              <span>Split down</span>
            </MenuItem>
          </>
        )}
      <MenuSeparator />
      <MenuItem
        data-track-owner={owner("MenuItem[onClick=onReopen]")}
        disabled={onReopen === undefined}
        onClick={onReopen}
      >
        <span className={menuIcon}>
          <UndoGlyph />
        </span>
        <span>Reopen closed tab</span>
        <span className={menuTrailing}>{shortcutFor("tab.reopen")}</span>
      </MenuItem>
      {entry !== undefined && (
        <MenuItem
          data-track-owner={owner("MenuItem.7")}
          onClick={() => copyLink(tabLink(threadId, entry.tab))}
        >
          <span className={menuIcon}>
            <LinkGlyph />
          </span>
          <span>Copy link</span>
        </MenuItem>
      )}
      <MenuSeparator />
      <MenuItem
        data-track-owner={owner("MenuItem.8")}
        disabled={railTabs.length < 2}
        onClick={() => cycle(-1)}
      >
        <span className={menuIcon}>
          <ArrowLeftGlyph />
        </span>
        <span>Previous tab</span>
        <span className={menuTrailing}>{shortcutFor("paneTab.previous")}</span>
      </MenuItem>
      <MenuItem
        data-track-owner={owner("MenuItem.9")}
        disabled={railTabs.length < 2}
        onClick={() => cycle(1)}
      >
        <span className={menuIcon}>
          <ArrowRightGlyph />
        </span>
        <span>Next tab</span>
        <span className={menuTrailing}>{shortcutFor("paneTab.next")}</span>
      </MenuItem>
      <MenuSeparator />
      <MenuCheckboxItem
        data-track-owner={owner(
          "MenuCheckboxItem[onCheckedChange=setAutoClose]",
        )}
        checked={autoClose}
        onCheckedChange={onAutoCloseChange}
      >
        <span>Close tabs automatically</span>
      </MenuCheckboxItem>
    </>
  );
}
