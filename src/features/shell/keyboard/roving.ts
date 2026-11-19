import { type KeyboardEvent as ReactKeyboardEvent, useEffect } from "react";
import { type CommandHandlers, isEditableTarget } from "./dispatcher";

/**
 * Roving selection for a collection: one active item, moved by the arrows, Home
 * and End and by the printed list keys, left with Escape, and activated with
 * Enter through the item's own link or button. The active item is the focused
 * one, so there is no highlight to keep in sync with focus.
 *
 * A marked menu keeps its own highlight and answers the arrows itself, so
 * `j`/`k` there ask it for the arrow key it already understands, and the four
 * row actions click the menu item that claims them. The collection a key
 * belongs to is read from the document: the list holding focus, then the one
 * last pointed at, then the last one rendered.
 */

const LIST = "[data-roving-list]";
const ITEM = "[data-roving-item]";
const CHECK = "[data-roving-check]";
const MENU = "[data-slot='menu-content'], [data-slot='context-menu-content']";
const MENU_ITEM = "[role='menuitem']:not([data-disabled]):not(:disabled)";
const COMMAND = "data-menu-command";

/** Where each list left off, so a re-rendered row is found again. */
const lastIndex = new WeakMap<HTMLElement, number>();
let pointed: HTMLElement | null = null;
let watchingPointer = false;

function listOf(element: Element | null): HTMLElement | null {
  return element?.closest<HTMLElement>(LIST) ?? null;
}

function items(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>(ITEM));
}

/**
 * The list a bare key acts on: the one holding focus, else the one last
 * pointed at, else the last rendered, which is the page's own list rather than
 * the sidebar beside it.
 */
function activeList(): HTMLElement | null {
  const focused = document.activeElement;
  const holding = listOf(focused instanceof Element ? focused : null);
  if (holding !== null) return holding;
  if (pointed?.isConnected === true) return pointed;
  const lists = Array.from(document.querySelectorAll<HTMLElement>(LIST));
  return lists[lists.length - 1] ?? null;
}

/** The menu a key acts on, while one is open. Popups portal in the order they opened. */
function openMenu(): HTMLElement | null {
  const menus = Array.from(document.querySelectorAll<HTMLElement>(MENU));
  return menus[menus.length - 1] ?? null;
}

function activeIndex(list: HTMLElement): number {
  const rows = items(list);
  const focused = document.activeElement;
  if (focused instanceof HTMLElement) {
    const index = rows.findIndex(
      (row) => row === focused || row.contains(focused),
    );
    if (index !== -1) return index;
  }
  return lastIndex.get(list) ?? -1;
}

/**
 * Focus the row at `index` and scroll it into view only as far as it needs:
 * `nearest` leaves a row that is already on screen where it is.
 */
function focusItem(list: HTMLElement, index: number): boolean {
  const row = items(list)[index];
  if (row === undefined) return false;
  lastIndex.set(list, index);
  row.focus({ preventScroll: true });
  if (typeof row.scrollIntoView === "function")
    row.scrollIntoView({ block: "nearest" });
  return true;
}

function moveToList(list: HTMLElement, delta: 1 | -1): boolean {
  const rows = items(list);
  if (rows.length === 0) return false;
  const from = activeIndex(list);
  if (from === -1) return focusItem(list, delta === 1 ? 0 : rows.length - 1);
  const next = Math.min(Math.max(from + delta, 0), rows.length - 1);
  return next === from || focusItem(list, next);
}

function edgeOf(list: HTMLElement, edge: "first" | "last"): boolean {
  const rows = items(list);
  if (rows.length === 0) return false;
  return focusItem(list, edge === "first" ? 0 : rows.length - 1);
}

function leaveList(list: HTMLElement): boolean {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || !list.contains(focused))
    return false;
  focused.blur();
  return true;
}

/**
 * Ask the open menu for the arrow key it already answers rather than moving a
 * selection of ours, so the menu shows one highlight, not two.
 */
function pressArrow(menu: HTMLElement, delta: 1 | -1): boolean {
  const focused = document.activeElement;
  const target =
    focused instanceof HTMLElement && menu.contains(focused)
      ? focused
      : menu.querySelector<HTMLElement>(MENU_ITEM);
  if (target === null) return false;
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: delta === 1 ? "ArrowDown" : "ArrowUp",
      bubbles: true,
      cancelable: true,
    }),
  );
  return true;
}

function check(): boolean {
  if (openMenu() !== null) return false;
  const list = activeList();
  if (list === null) return false;
  const index = activeIndex(list);
  const row = index === -1 ? undefined : items(list)[index];
  const control = row?.querySelector<HTMLElement>(CHECK);
  if (control === undefined || control === null) return false;
  control.click();
  return true;
}

/**
 * Open the active row's own menu, so the row actions are reachable without a
 * pointer: its `…` trigger where the row has one, else the context menu a
 * right-click would open on the row.
 */
function openRowMenu(): boolean {
  const list = activeList();
  if (list === null) return false;
  const index = activeIndex(list);
  const row = index === -1 ? undefined : items(list)[index];
  if (row === undefined) return false;
  const owner = row.closest("[data-row-menu]") ?? row;
  const trigger = owner.querySelector<HTMLElement>(
    "[data-roving-menu-trigger]",
  );
  if (trigger !== null) {
    // A menu trigger opens on the press, not on `click()` from script.
    trigger.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    return true;
  }
  const box = row.getBoundingClientRect();
  row.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: box.left + 12,
      clientY: box.top + box.height / 2,
    }),
  );
  return true;
}

/** Click the open menu's item that claims `command`. */
function pick(command: string): boolean {
  const menu = openMenu();
  if (menu === null) return false;
  const item = menu.querySelector<HTMLElement>(
    `[${COMMAND}="${command}"]:not([data-disabled]):not(:disabled)`,
  );
  if (item === null) return false;
  item.click();
  return true;
}

/** The list keys, printed in Settings → Shortcuts as the list and menu rows. */
export const createRovingCommands = (): CommandHandlers => ({
  "list.next": () => {
    const menu = openMenu();
    if (menu !== null) return pressArrow(menu, 1);
    const list = activeList();
    return list === null ? false : moveToList(list, 1);
  },
  "list.previous": () => {
    const menu = openMenu();
    if (menu !== null) return pressArrow(menu, -1);
    const list = activeList();
    return list === null ? false : moveToList(list, -1);
  },
  "list.check": () => check(),
  "commandMenu.actions": () => openRowMenu(),
  "menu.markUnread": () => pick("menu.markUnread"),
  "menu.archive": () => pick("menu.archive"),
  "menu.settle": () => pick("menu.settle"),
  "menu.delete": () => pick("menu.delete"),
});

function handleListKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.defaultPrevented || event.repeat || event.nativeEvent.isComposing)
    return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  if (isEditableTarget(event.target)) return;
  const list = event.currentTarget;
  const rows = items(list);
  if (rows.length === 0) return;
  const from = activeIndex(list);
  const step = (to: number) => focusItem(list, to);
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      if (from === -1) step(0);
      else step(Math.min(from + 1, rows.length - 1));
      return;
    case "ArrowUp":
      event.preventDefault();
      if (from === -1) step(rows.length - 1);
      else step(Math.max(from - 1, 0));
      return;
    case "Home":
      event.preventDefault();
      edgeOf(list, "first");
      return;
    case "End":
      event.preventDefault();
      edgeOf(list, "last");
      return;
    case "Escape":
      if (leaveList(list)) event.preventDefault();
      return;
    default:
      return;
  }
}

function watchPointer() {
  if (watchingPointer || typeof document === "undefined") return;
  watchingPointer = true;
  document.addEventListener(
    "pointerdown",
    (event) => {
      pointed = listOf(event.target instanceof Element ? event.target : null);
    },
    true,
  );
}

export type RovingListProps = {
  "data-roving-list": "";
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

/**
 * Makes a container a roving collection: spread this onto the element that
 * holds the rows and mark each row with `data-roving-item`. A row that can be
 * checked marks its checkbox with `data-roving-check`, so `x` toggles it.
 */
export function useRovingList(): RovingListProps {
  useEffect(() => {
    watchPointer();
  }, []);
  return { "data-roving-list": "", onKeyDown: handleListKeyDown };
}
