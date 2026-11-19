import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerCommands } from "./dispatcher";
import { createRovingCommands, useRovingList } from "./roving";
import { KEYBINDS_KEY } from "./store";

const disposers: Array<() => void> = [];
const registerRoving = () => {
  const dispose = registerCommands(createRovingCommands());
  disposers.push(dispose);
  return dispose;
};

const scrollIntoView = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  window.localStorage.removeItem(KEYBINDS_KEY);
  scrollIntoView.mockReset();
  cleanup();
});

function Rows({ labels, check }: { labels: string[]; check?: () => void }) {
  const roving = useRovingList();
  return (
    <div {...roving}>
      {labels.map((label) => (
        <div key={label} role="option" tabIndex={-1} data-roving-item="">
          <button type="button">{label}</button>
          {check === undefined ? null : (
            <button type="button" data-roving-check="" onClick={check}>
              select {label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Focus the row itself, as a link or button row receives it. */
const focusRow = (index: number) => {
  const row =
    document.querySelectorAll<HTMLElement>("[data-roving-item]")[index];
  if (row === null || row === undefined) throw new Error("no row");
  row.focus();
  return row;
};

const activeRow = () => {
  const focused = document.activeElement;
  return focused instanceof HTMLElement
    ? focused.closest<HTMLElement>("[data-roving-item]")
    : null;
};

const labels = ["one", "two", "three"];

describe("roving selection", () => {
  it("moves the active row with the arrows and stops at the ends", () => {
    render(<Rows labels={labels} />);
    focusRow(0);
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowDown",
    });
    expect(activeRow()?.textContent).toContain("two");
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowUp",
    });
    expect(activeRow()?.textContent).toContain("one");
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowUp",
    });
    expect(activeRow()?.textContent).toContain("one");
  });

  it("moves with the printed list keys, from the row that has focus", () => {
    registerRoving();
    render(<Rows labels={labels} />);
    focusRow(0);
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "j",
      code: "KeyJ",
    });
    expect(activeRow()?.textContent).toContain("two");
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "j",
      code: "KeyJ",
    });
    expect(activeRow()?.textContent).toContain("three");
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "k",
      code: "KeyK",
    });
    expect(activeRow()?.textContent).toContain("two");
  });

  it("jumps to the ends with Home and End", () => {
    render(<Rows labels={labels} />);
    focusRow(1);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(activeRow()?.textContent).toContain("three");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    expect(activeRow()?.textContent).toContain("one");
  });

  it("scrolls the new row into view only as far as it is out", () => {
    render(<Rows labels={labels} />);
    focusRow(0);
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowDown",
    });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("leaves the list on Escape", () => {
    render(<Rows labels={labels} />);
    focusRow(1);
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "Escape",
    });
    expect(activeRow()).toBeNull();
  });

  it("checks the active row from the printed check key", () => {
    const check = vi.fn();
    registerRoving();
    render(<Rows labels={labels} check={check} />);
    focusRow(1);
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "x",
      code: "KeyX",
    });
    expect(check).toHaveBeenCalledOnce();
    expect(activeRow()?.textContent).toContain("two");
  });

  it("keeps a field inside a row for typing", () => {
    render(<Rows labels={labels} />);
    const field = document.createElement("input");
    document.querySelectorAll("[data-roving-item]")[0]?.append(field);
    field.focus();
    const event = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
      cancelable: true,
    });
    field.dispatchEvent(event);
    expect(document.activeElement).toBe(field);
    expect(event.defaultPrevented).toBe(false);
  });

  it("acts on the last list rendered when nothing holds focus", () => {
    registerRoving();
    render(
      <>
        <Rows labels={["sidebar one", "sidebar two"]} />
        <Rows labels={["page one", "page two"]} />
      </>,
    );
    fireEvent.keyDown(document.body, { key: "j", code: "KeyJ" });
    expect(activeRow()?.textContent).toContain("page one");
  });
});

describe("roving selection inside an open menu", () => {
  const menu = () => {
    const popup = document.createElement("div");
    popup.setAttribute("data-slot", "menu-content");
    for (const [label, command] of [
      ["Mark as unread", "menu.markUnread"],
      ["Archive", "menu.archive"],
    ] as const) {
      const item = document.createElement("button");
      item.setAttribute("role", "menuitem");
      item.setAttribute("data-menu-command", command);
      item.textContent = label;
      popup.append(item);
    }
    document.body.append(popup);
    return popup;
  };

  it("asks the menu for the arrow key it already answers", () => {
    registerRoving();
    const popup = menu();
    const first = popup.querySelector("button") as HTMLElement;
    const heard = vi.fn();
    first.addEventListener("keydown", heard);
    first.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "j",
      code: "KeyJ",
    });
    expect(heard.mock.calls.map((call) => call[0].key)).toEqual([
      "j",
      "ArrowDown",
    ]);
  });

  it("clicks the menu row that claims the action", () => {
    registerRoving();
    const popup = menu();
    const archive = popup.querySelector(
      "[data-menu-command='menu.archive']",
    ) as HTMLElement;
    const clicked = vi.fn();
    archive.addEventListener("click", clicked);
    fireEvent.keyDown(document.body, { key: "a", code: "KeyA" });
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("leaves a disabled row for its own reason", () => {
    registerRoving();
    const popup = menu();
    const archive = popup.querySelector(
      "[data-menu-command='menu.archive']",
    ) as HTMLElement;
    archive.setAttribute("data-disabled", "");
    const clicked = vi.fn();
    archive.addEventListener("click", clicked);
    fireEvent.keyDown(document.body, { key: "a", code: "KeyA" });
    expect(clicked).not.toHaveBeenCalled();
  });
});
