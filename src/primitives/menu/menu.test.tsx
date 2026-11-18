import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Menu,
  MenuActionItem,
  MenuCheckboxItem,
  MenuContent,
  MenuDigit,
  MenuItem,
  MenuLabel,
  MenuRow,
  MenuSearchRow,
  type MenuSearchRowProps,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
  menuRowVariants,
} from "./menu";

afterEach(cleanup);

const classes = (className: string) => className.split(" ");

describe("menuRowVariants", () => {
  it("picks one recipe class per density, and the radius with it", () => {
    const palette = classes(menuRowVariants({ density: "palette" }));
    expect(palette).toContain("kiki-palette-row");
    expect(palette).not.toContain("kiki-menu-row");
    expect(palette).toContain("rounded-(--radius-overlay)");
    const rich = classes(menuRowVariants({ density: "rich" }));
    expect(rich).toContain("kiki-menu-row-rich");
    expect(rich).not.toContain("kiki-menu-row ");
    const fallback = classes(menuRowVariants());
    expect(fallback).toContain("kiki-menu-row");
    expect(fallback).toContain("text-foreground");
  });

  it("tints the danger highlight and swaps the interaction style", () => {
    const danger = classes(
      menuRowVariants({ intent: "danger", interaction: "button" }),
    );
    expect(danger).toContain("[--menu-row-highlight:var(--destructive-soft)]");
    expect(danger).toContain(
      "hover:bg-[var(--menu-row-highlight,var(--popover-hover))]",
    );
    expect(danger).not.toContain("text-foreground");
  });
});

describe("Menu", () => {
  it("renders Capy's slots inside an open menu", () => {
    render(
      <Menu open>
        <MenuTrigger>Open</MenuTrigger>
        <MenuContent height="bounded" className="w-56">
          <MenuLabel>Sort by</MenuLabel>
          <MenuItem>New thread</MenuItem>
          <MenuCheckboxItem checked>Show archived</MenuCheckboxItem>
          <MenuSub>
            <MenuSubTrigger>Move to</MenuSubTrigger>
          </MenuSub>
          <MenuSeparator />
          <MenuItem intent="danger">Archive</MenuItem>
        </MenuContent>
      </Menu>,
    );
    expect(screen.getByText("Open").dataset.slot).toBe("menu-trigger");
    const content = document.querySelector<HTMLElement>(
      "[data-slot=menu-content]",
    );
    expect(content?.className).toContain(
      "max-h-[min(20rem,var(--available-height))]",
    );
    expect(content?.className).not.toContain("60dvh");
    expect(content?.className).toContain("w-56");
    expect(content?.firstElementChild?.hasAttribute("data-menu-list")).toBe(
      true,
    );
    expect(screen.getByText("Sort by").dataset.slot).toBe("menu-label");
    expect(screen.getByText("New thread").dataset.slot).toBe("menu-item");
    expect(screen.getByText("New thread").dataset.intent).toBeUndefined();
    expect(screen.getByText("Archive").dataset.intent).toBe("danger");
    expect(screen.getByRole("menuitemcheckbox").getAttribute("data-slot")).toBe(
      "menu-checkbox-item",
    );
    const sub = screen.getByText("Move to");
    expect(sub.dataset.slot).toBe("menu-sub-trigger");
    expect(sub.querySelector("svg")).not.toBeNull();
    expect(document.querySelector("[data-slot=menu-separator]")).not.toBeNull();
  });

  it("hides the sub-trigger chevron on request", () => {
    render(
      <Menu open>
        <MenuContent>
          <MenuSub>
            <MenuSubTrigger showChevron={false}>Tags</MenuSubTrigger>
          </MenuSub>
        </MenuContent>
      </Menu>,
    );
    expect(screen.getByText("Tags").querySelector("svg")).toBeNull();
  });
});

describe("MenuActionItem", () => {
  it("is a plain button with selection and intent attributes", () => {
    render(
      <MenuActionItem selected intent="danger">
        Delete
      </MenuActionItem>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset.slot).toBe("menu-action-item");
    expect(button.dataset.selected).toBe("");
    expect(button.dataset.intent).toBe("danger");
  });
});

describe("MenuRow", () => {
  it("lays out icon, label, description and trailing", () => {
    render(
      <MenuRow
        density="rich"
        icon={<i>icon</i>}
        label="New thread"
        description="Start fresh"
        trailing="11h"
      />,
    );
    const row = screen.getByText("New thread").closest("[data-slot=menu-row]");
    expect(row?.tagName).toBe("SPAN");
    expect(screen.getByText("icon").parentElement?.className).toContain(
      "h-5 self-start",
    );
    expect(screen.getByText("11h").className).toContain("ml-auto");
    expect(screen.getByText("Start fresh").className).toContain("text-xs");
  });

  it("falls back to children and keeps icons centred without a description", () => {
    render(
      <MenuRow density="rich" icon={<i>icon</i>}>
        Archive
      </MenuRow>,
    );
    expect(screen.getByText("Archive")).toBeTruthy();
    expect(screen.getByText("icon").parentElement?.className).not.toContain(
      "self-start",
    );
  });
});

describe("MenuSearchRow", () => {
  const setup = (props: MenuSearchRowProps) => {
    const first = vi.fn();
    const second = vi.fn();
    const before = vi.fn();
    render(
      <div role="menu">
        <button type="button" role="menuitem" onClick={before}>
          Before
        </button>
        <MenuSearchRow {...props}>
          <input aria-label="Search" />
        </MenuSearchRow>
        <button type="button" role="menuitem" disabled>
          Disabled
        </button>
        <button type="button" role="menuitem" onClick={first}>
          First <MenuDigit index={0} />
        </button>
        <button type="button" role="menuitem" onClick={second}>
          Second <MenuDigit index={1} />
        </button>
      </div>,
    );
    return { first, second, before, input: screen.getByLabelText("Search") };
  };

  it("keeps both shortcuts working when the caller passes a ref", () => {
    const objectRef = createRef<HTMLDivElement>();
    const { first, second, input } = setup({
      ref: objectRef,
      pickOnEnter: true,
      pickOnDigit: true,
    });
    expect(objectRef.current?.dataset.slot).toBe("menu-search-row");
    fireEvent.keyDown(input, { key: "2" });
    expect(second).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "fi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(first).toHaveBeenCalledTimes(1);
    cleanup();
    let node: HTMLDivElement | null = null;
    const callback = setup({
      ref: (el) => {
        node = el;
      },
      pickOnEnter: true,
    });
    expect(node).not.toBeNull();
    fireEvent.change(callback.input, { target: { value: "fi" } });
    fireEvent.keyDown(callback.input, { key: "Enter" });
    expect(callback.first).toHaveBeenCalledTimes(1);
  });

  it("skips the shortcuts when the caller's capture handler prevents the key", () => {
    const { first, second, input } = setup({
      pickOnEnter: true,
      pickOnDigit: true,
      onKeyDownCapture: (event) => event.preventDefault(),
    });
    fireEvent.keyDown(input, { key: "2" });
    fireEvent.change(input, { target: { value: "fi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(second).not.toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  it("renders its slot and a trailing separator", () => {
    setup({});
    const row = document.querySelector("[data-slot=menu-search-row]");
    expect(row?.nextElementSibling?.getAttribute("data-slot")).toBe(
      "menu-separator",
    );
  });

  it("picks the first enabled item after the row on Enter", () => {
    const { first, before, input } = setup({ pickOnEnter: true });
    fireEvent.change(input, { target: { value: "fi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(first).toHaveBeenCalledTimes(1);
    expect(before).not.toHaveBeenCalled();
  });

  it("ignores Enter on an empty query or without pickOnEnter", () => {
    const { first, input } = setup({ pickOnEnter: true });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(first).not.toHaveBeenCalled();
    cleanup();
    const other = setup({});
    fireEvent.change(other.input, { target: { value: "fi" } });
    fireEvent.keyDown(other.input, { key: "Enter" });
    expect(other.first).not.toHaveBeenCalled();
  });

  it("picks the item carrying the typed digit while the query is empty", () => {
    const { first, second, input } = setup({ pickOnDigit: true });
    fireEvent.keyDown(input, { key: "2" });
    expect(second).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "1" });
    expect(first).not.toHaveBeenCalled();
  });
});

describe("MenuDigit", () => {
  it("numbers the first ten rows 1 to 0", () => {
    const { container } = render(
      <>
        <MenuDigit index={0} />
        <MenuDigit index={9} />
        <MenuDigit index={10} />
      </>,
    );
    const digits = [...container.querySelectorAll("[data-menu-digit]")].map(
      (el) => el.getAttribute("data-menu-digit"),
    );
    expect(digits).toEqual(["1", "0"]);
  });
});
