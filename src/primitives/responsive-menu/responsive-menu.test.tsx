import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createLevelStack } from "./level-stack";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLabel,
  ResponsiveMenuPage,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
  ResponsiveMenuTrigger,
} from "./responsive-menu";

let phone = false;

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return phone;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  phone = false;
});

describe("createLevelStack", () => {
  it("pops the most recent level first", () => {
    const stack = createLevelStack();
    const calls: string[] = [];
    stack.push(() => calls.push("first"));
    const removeSecond = stack.push(() => calls.push("second"));
    expect(stack.popTop()).toBe(true);
    expect(calls).toEqual(["second"]);
    removeSecond();
    expect(stack.popTop()).toBe(true);
    expect(calls).toEqual(["second", "first"]);
  });

  it("returns false when nothing is pushed", () => {
    expect(createLevelStack().popTop()).toBe(false);
  });
});

function ThreadOptions(props: {
  onOpenChange?: (open: boolean) => void;
  onNewFolder?: () => void;
  onDetailed?: (checked: boolean) => void;
  onSubOpenChange?: (open: boolean) => void;
  detailed?: boolean;
}) {
  return (
    <ResponsiveMenu onOpenChange={props.onOpenChange}>
      <ResponsiveMenuTrigger>Options</ResponsiveMenuTrigger>
      <ResponsiveMenuContent>
        <ResponsiveMenuItem onClick={props.onNewFolder}>
          New folder
        </ResponsiveMenuItem>
        <ResponsiveMenuItem closeOnClick={false}>Stay open</ResponsiveMenuItem>
        <ResponsiveMenuSeparator />
        <ResponsiveMenuLabel>View</ResponsiveMenuLabel>
        <ResponsiveMenuSub
          label="Density"
          value="Detailed"
          onOpenChange={props.onSubOpenChange}
        >
          <ResponsiveMenuCheckboxItem
            checked={props.detailed ?? false}
            onCheckedChange={props.onDetailed}
          >
            Detailed
          </ResponsiveMenuCheckboxItem>
        </ResponsiveMenuSub>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

describe("ResponsiveMenu on desktop", () => {
  it("renders Menu parts inside a responsive-menu-level", async () => {
    render(<ThreadOptions />);
    fireEvent.click(screen.getByText("Options"));
    const item = await screen.findByText("New folder");
    expect(item.closest("[data-slot=menu-item]")).not.toBeNull();
    const level = item.closest("[data-slot=responsive-menu-level]");
    expect(level?.hasAttribute("data-menu-list")).toBe(true);
    expect(screen.getByText("View").getAttribute("data-slot")).toBe(
      "menu-label",
    );
    expect(document.querySelector("[data-slot=responsive-menu-item]")).toBe(
      null,
    );
  });

  it("shows the sub row value with a chevron", async () => {
    render(<ThreadOptions />);
    fireEvent.click(screen.getByText("Options"));
    const value = await screen.findByText("Detailed");
    const row = value.closest("[data-slot=menu-row]");
    expect(row?.textContent).toBe("DensityDetailed");
    expect(row?.querySelectorAll("svg")).toHaveLength(1);
  });
});

describe("ResponsiveMenu on phone", () => {
  it("renders a drawer of responsive-menu items that close on click", async () => {
    phone = true;
    const onOpenChange = vi.fn();
    const onNewFolder = vi.fn();
    render(
      <ThreadOptions onOpenChange={onOpenChange} onNewFolder={onNewFolder} />,
    );
    fireEvent.click(screen.getByText("Options"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const item = await screen.findByText("New folder");
    expect(item.getAttribute("data-slot")).toBe("responsive-menu-item");
    expect(item.closest("[data-slot=drawer-content]")).not.toBeNull();
    expect(item.tagName).toBe("BUTTON");
    expect(screen.getByText("View").hasAttribute("data-slot")).toBe(false);
    fireEvent.click(item);
    expect(onNewFolder).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps the drawer open when closeOnClick is false", async () => {
    phone = true;
    const onOpenChange = vi.fn();
    render(<ThreadOptions onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Options"));
    fireEvent.click(await screen.findByText("Stay open"));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("pushes a sub page, covers the parent level and pops back", async () => {
    phone = true;
    const onSubOpenChange = vi.fn();
    render(<ThreadOptions onSubOpenChange={onSubOpenChange} />);
    fireEvent.click(screen.getByText("Options"));
    fireEvent.click(await screen.findByText("Density"));
    expect(onSubOpenChange).toHaveBeenLastCalledWith(true);
    const pushed = document.querySelector("[data-nav=push]");
    expect(pushed?.getAttribute("data-slot")).toBe("responsive-menu-level");
    const root = screen
      .getByText("New folder")
      .closest("[data-slot=responsive-menu-level]");
    expect(root?.classList.contains("hidden")).toBe(true);
    const back = screen
      .getAllByText("Density")
      .find((node) => node.closest("[data-nav=push]"));
    expect(back?.className).toContain("font-medium");
    const backItem = back?.closest("[data-slot=responsive-menu-item]");
    if (!backItem) throw new Error("back item missing");
    fireEvent.click(backItem);
    expect(onSubOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.querySelector("[data-nav=push]")).toBeNull();
    expect(root?.getAttribute("data-nav")).toBe("pop");
    expect(root?.classList.contains("hidden")).toBe(false);
  });

  it("toggles a checkbox item with the indicator state", async () => {
    phone = true;
    const onDetailed = vi.fn();
    render(<ThreadOptions detailed onDetailed={onDetailed} />);
    fireEvent.click(screen.getByText("Options"));
    fireEvent.click(await screen.findByText("Density"));
    const checkbox = document.querySelector(
      "[data-slot=responsive-menu-checkbox-item]",
    );
    if (!checkbox) throw new Error("checkbox missing");
    expect(checkbox.textContent).toBe("Detailed");
    expect(checkbox.querySelector("[data-checked]")).not.toBeNull();
    fireEvent.click(checkbox);
    expect(onDetailed).toHaveBeenCalledWith(false);
  });

  it("pops the top page on Escape instead of closing", async () => {
    phone = true;
    const onOpenChange = vi.fn();
    render(<ThreadOptions onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Options"));
    fireEvent.click(await screen.findByText("Density"));
    expect(document.querySelector("[data-nav=push]")).not.toBeNull();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(document.querySelector("[data-nav=push]")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("ResponsiveMenuPage on desktop", () => {
  it("focuses the pushed page and disables the covered level", async () => {
    render(
      <ResponsiveMenu>
        <ResponsiveMenuTrigger>Options</ResponsiveMenuTrigger>
        <ResponsiveMenuContent>
          <ResponsiveMenuPage label="Sort by" trigger="Sort by">
            <ResponsiveMenuItem>Updated at</ResponsiveMenuItem>
          </ResponsiveMenuPage>
        </ResponsiveMenuContent>
      </ResponsiveMenu>,
    );
    fireEvent.click(screen.getByText("Options"));
    const trigger = (await screen.findByText("Sort by")).closest(
      "[role=menuitem]",
    );
    if (!(trigger instanceof HTMLElement)) throw new Error("trigger missing");
    fireEvent.click(trigger);
    const pushed = document.querySelector("[data-nav=push]");
    const back = pushed?.querySelector("[role=menuitem]");
    expect(back?.textContent).toBe("Sort by");
    expect(document.activeElement).toBe(back);
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
    expect(screen.getByText("Updated at").closest("[data-nav=push]")).toBe(
      pushed,
    );
  });
});
