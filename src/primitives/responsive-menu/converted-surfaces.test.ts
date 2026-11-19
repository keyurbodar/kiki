import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Surfaces whose menus open as drawers at phone.
 *
 * They may import the responsive menu primitives and nothing else from the menu
 * library. `ResponsiveMenuItem` is a plain button at phone and a base-ui
 * `MenuItem` above it, so a base-ui item rendered inside a drawer has no menu
 * root to attach to: the drawer still opens, and its rows do nothing. That is
 * how this conversion gets undone — one item added beside the import.
 *
 * Files that keep a `ContextMenu` (a right-click menu, not a phone surface) are
 * allowed base-ui items inside it and nowhere else.
 */
const converted = [
  "src/components/actor-filter/actor-filter.tsx",
  "src/components/issue-relations/issue-relations.tsx",
  "src/components/issue-view/thread-actions-menu.tsx",
  "src/components/issues-filters/issues-filters.tsx",
  "src/components/issues-list/issues-list.tsx",
  "src/components/issues-toolbar/issues-toolbar.tsx",
  "src/components/view-toolbar/view-toolbar.tsx",
  "src/features/automations/automations-page/filter-menu.tsx",
  "src/features/issues/issue-pickers/issue-pickers.tsx",
  "src/features/pulls/pulls-page/pulls-filters.tsx",
  "src/features/threads/threads-page/threads-page.tsx",
];

/** The part of a file outside its context menus, which may hold base-ui rows. */
const outsideContextMenus = (source: string) =>
  source.replace(/<ContextMenu>[\s\S]*?<\/ContextMenu>/g, "");

const help = (path: string) =>
  `${path} renders a base-ui menu row on a surface whose menus open as drawers at phone. ` +
  "Use ResponsiveMenuItem (or ResponsiveMenuSeparator, ResponsiveMenuCheckboxItem) from " +
  "@/primitives/responsive-menu instead: it renders the same row at desktop and a plain " +
  "button at phone, where a base-ui row has no menu root to attach to and the drawer's rows " +
  "stop responding. Inside a ContextMenu the base-ui row is still correct.";

describe("converted surfaces", () => {
  for (const path of converted) {
    const source = outsideContextMenus(readFileSync(path, "utf8"));
    it(`${path} renders no base-ui menu rows outside a context menu`, () => {
      expect(
        source.includes("<MenuItem") || source.includes("<MenuSeparator"),
        help(path),
      ).toBe(false);
    });
    it(`${path} keeps its rows responsive`, () => {
      expect(
        readFileSync(path, "utf8").includes("<ResponsiveMenu"),
        `${path} imports no responsive menu primitive; see ${help(path)}`,
      ).toBe(true);
    });
  }
});
