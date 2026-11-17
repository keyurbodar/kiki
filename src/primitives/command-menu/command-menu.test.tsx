import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { type KeyboardEvent, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CommandMenu,
  CommandMenuContent,
  CommandMenuDialog,
  CommandMenuEmpty,
  CommandMenuFilter,
  CommandMenuFilters,
  CommandMenuFooter,
  CommandMenuGroup,
  CommandMenuGroupLabel,
  CommandMenuHint,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  highlightedValue,
  resolveFinalFocus,
} from "./command-menu";

afterEach(cleanup);

describe("resolveFinalFocus", () => {
  it("returns focus to the element that opened the menu while it is connected", () => {
    const button = document.createElement("button");
    document.body.append(button);
    expect(resolveFinalFocus(undefined, "keyboard", button)).toBe(button);
    expect(resolveFinalFocus(true, "keyboard", button)).toBe(button);
    expect(resolveFinalFocus(() => undefined, "keyboard", button)).toBe(button);
    button.remove();
    expect(resolveFinalFocus(undefined, "keyboard", button)).toBe(true);
    expect(resolveFinalFocus(undefined, "keyboard", null)).toBe(true);
  });

  it("keeps an explicit target from the caller", () => {
    const opener = document.createElement("button");
    const other = document.createElement("input");
    document.body.append(opener, other);
    expect(resolveFinalFocus(false, "mouse", opener)).toBe(false);
    expect(resolveFinalFocus(() => other, "mouse", opener)).toBe(other);
    expect(resolveFinalFocus({ current: other }, "mouse", opener)).toBe(other);
    expect(resolveFinalFocus(() => null, "mouse", opener)).toBe(opener);
    opener.remove();
    other.remove();
  });
});

describe("highlightedValue", () => {
  it("reads data-value from the highlighted row", () => {
    const list = document.createElement("div");
    list.innerHTML =
      '<div data-value="a"></div><div data-value="b" data-highlighted=""></div>';
    expect(highlightedValue(list)).toBe("b");
    list
      .querySelector("[data-highlighted]")
      ?.removeAttribute("data-highlighted");
    expect(highlightedValue(list)).toBeUndefined();
  });
});

function Palette({
  onHighlightChange,
}: {
  onHighlightChange?: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open palette
      </button>
      <CommandMenuDialog open={open} onOpenChange={setOpen}>
        <CommandMenuContent>
          <button type="button" onClick={() => setOpen(false)}>
            Close palette
          </button>
          <CommandMenu open>
            <CommandMenuInput
              placeholder="Search"
              trailing={<span>Trailing</span>}
            />
            <CommandMenuFilters>
              <CommandMenuFilter active>All</CommandMenuFilter>
              <CommandMenuFilter>Actions</CommandMenuFilter>
            </CommandMenuFilters>
            <CommandMenuList onHighlightChange={onHighlightChange}>
              <CommandMenuGroup>
                <CommandMenuGroupLabel>Actions</CommandMenuGroupLabel>
                <CommandMenuItem value="rename">Rename</CommandMenuItem>
                <CommandMenuItem value="delete" intent="danger">
                  Delete
                </CommandMenuItem>
              </CommandMenuGroup>
            </CommandMenuList>
            <CommandMenuFooter>
              <CommandMenuHint keys="Esc" label="Close" />
            </CommandMenuFooter>
          </CommandMenu>
        </CommandMenuContent>
      </CommandMenuDialog>
    </div>
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("CommandMenu", () => {
  it("renders Capy's data-slots inside a labelled dialog and focuses the input", async () => {
    render(<Palette />);
    fireEvent.click(screen.getByText("Open palette"));
    await waitFor(() => expect(slot("command-menu-content")).not.toBeNull());
    for (const name of [
      "dialog-overlay",
      "command-menu",
      "command-menu-input",
      "command-menu-filters",
      "command-menu-filter",
      "command-menu-list",
      "command-menu-group",
      "command-menu-group-label",
      "command-menu-item",
      "command-menu-footer",
    ]) {
      expect(slot(name), name).not.toBeNull();
    }
    expect(slot("command-menu-content")?.getAttribute("aria-label")).toBe(
      "Command menu",
    );
    expect(slot("command-menu")?.parentElement).toBe(
      slot("command-menu-content"),
    );
    expect(screen.getByText("Trailing")).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement).toBe(slot("command-menu-input")),
    );
  });

  it("marks filters as tabs and items with their value and intent", async () => {
    render(<Palette />);
    fireEvent.click(screen.getByText("Open palette"));
    const all = await screen.findByText("All");
    expect(all.getAttribute("role")).toBe("tab");
    expect(all.getAttribute("aria-selected")).toBe("true");
    expect(all.getAttribute("tabindex")).toBe("-1");
    expect(
      screen
        .getByText("Actions", { selector: "button" })
        .hasAttribute("aria-selected"),
    ).toBe(false);
    expect(slot("command-menu-filters")?.getAttribute("role")).toBe("tablist");
    const rename = screen.getByText("Rename");
    const del = screen.getByText("Delete");
    expect(rename.dataset.value).toBe("rename");
    expect(rename.dataset.intent).toBeUndefined();
    expect(del.dataset.intent).toBe("danger");
  });

  it("keeps typing keys inside the input but lets Escape through", () => {
    const events: Array<KeyboardEvent<HTMLInputElement>> = [];
    render(
      <CommandMenu>
        <CommandMenuInput
          aria-label="Search"
          onKeyDown={(event) => events.push(event)}
        />
      </CommandMenu>,
    );
    const input = screen.getByLabelText("Search");
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(events.map((event) => event.key)).toEqual(["a", "Escape"]);
    expect(events[0]?.isPropagationStopped()).toBe(true);
    expect(events[1]?.isPropagationStopped()).toBe(false);
  });

  it("reports the highlighted value as it changes", async () => {
    const onHighlightChange = vi.fn();
    render(<Palette onHighlightChange={onHighlightChange} />);
    fireEvent.click(screen.getByText("Open palette"));
    const rename = await screen.findByText("Rename");
    await act(async () => {
      rename.setAttribute("data-highlighted", "");
    });
    await waitFor(() =>
      expect(onHighlightChange).toHaveBeenLastCalledWith("rename"),
    );
    await act(async () => {
      rename.removeAttribute("data-highlighted");
    });
    await waitFor(() =>
      expect(onHighlightChange).toHaveBeenLastCalledWith(undefined),
    );
  });

  it("returns focus to the opener when it closes", async () => {
    render(<Palette />);
    const opener = screen.getByText("Open palette");
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() =>
      expect(document.activeElement).toBe(slot("command-menu-input")),
    );
    fireEvent.click(screen.getByText("Close palette"));
    await waitFor(() => expect(slot("command-menu-content")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});

describe("CommandMenuEmpty", () => {
  it("renders its slot and copy", () => {
    render(<CommandMenuEmpty>No results</CommandMenuEmpty>);
    expect(screen.getByText("No results").dataset.slot).toBe(
      "command-menu-empty",
    );
  });
});
