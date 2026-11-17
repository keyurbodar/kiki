import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { withClassName } from "./menu-parts";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectGroup,
  MenuSelectItem,
  MenuSelectLabel,
  MenuSelectTrigger,
  MenuSelectValue,
} from "./menu-select";

afterEach(cleanup);

const items = [
  { value: "default", label: "Workspace default" },
  { value: "everyone", label: "Everyone in the workspace" },
  { value: "specific", label: "Only specific people" },
];

function renderSelect(open: boolean) {
  return render(
    <MenuSelect items={items} defaultValue="default" defaultOpen={open}>
      <MenuSelectTrigger variant="outline" size="sm" className="w-full">
        <MenuSelectValue />
      </MenuSelectTrigger>
      <MenuSelectContent>
        <MenuSelectGroup>
          <MenuSelectLabel>Access</MenuSelectLabel>
          {items.map((item) => (
            <MenuSelectItem
              key={item.value}
              value={item.value}
              icon={<svg data-testid={`icon-${item.value}`} />}
              trailing={item.value === "specific" ? <span>3</span> : null}
            >
              {item.label}
            </MenuSelectItem>
          ))}
        </MenuSelectGroup>
      </MenuSelectContent>
    </MenuSelect>,
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("MenuSelect", () => {
  it("renders the trigger with the chevron and the selected value", () => {
    renderSelect(false);
    const trigger = slot("menu-select-trigger");
    expect(trigger?.className).toContain("justify-between!");
    expect(trigger?.className).toContain(
      "data-[placeholder]:text-muted-foreground-3",
    );
    expect(trigger?.className).toContain("w-full");
    expect(trigger?.querySelector("svg")?.getAttribute("class")).toBe(
      "size-(--icon-sm) shrink-0 text-muted-foreground-3",
    );
    expect(slot("menu-select-value")?.textContent).toBe("Workspace default");
  });

  it("opens Capy's menu surface with every slot", async () => {
    renderSelect(true);
    await act(async () => {});
    const content = slot("menu-select-content");
    expect(content?.className).toContain("min-w-(--anchor-width)");
    expect(content?.className).not.toContain("min-w-32");
    expect(content?.className).toContain("bg-popover");
    expect(content?.parentElement?.className).toBe(
      "z-(--z-overlay-content) outline-none",
    );
    const list = content?.querySelector("[data-menu-list]");
    expect(list?.className).toContain("md:scroll-fade-y");
    expect(slot("menu-select-group")).not.toBeNull();
    expect(slot("menu-select-label")?.className).toContain(
      "text-muted-foreground-2",
    );
    expect(
      document.querySelectorAll('[data-slot="menu-select-item"]'),
    ).toHaveLength(3);
  });

  it("lays out icon, text, check and trailing in Capy's order", async () => {
    renderSelect(true);
    await act(async () => {});
    const selected = screen.getByRole("option", { name: /Workspace default/ });
    const [icon, text, indicator] = Array.from(selected.children);
    expect(icon?.className).toContain("size-(--icon-sm)");
    expect(icon?.querySelector("[data-testid=icon-default]")).not.toBeNull();
    expect(text?.className).toBe("min-w-0 flex-1");
    expect(indicator?.className).toBe("ml-auto");
    expect(indicator?.querySelector("svg")?.getAttribute("class")).toBe(
      "size-(--icon-sm) shrink-0 text-foreground",
    );
    const specific = screen.getByRole("option", { name: /Only specific/ });
    expect(specific.lastElementChild?.textContent).toBe("3");
  });
});

describe("withClassName", () => {
  it("joins a string className after the base", () => {
    expect(withClassName("a b", "c")).toBe("a b c");
    expect(withClassName("a", undefined)).toBe("a");
  });

  it("wraps a state callback so the base always applies", () => {
    const merged = withClassName<{ open: boolean }>("base", (state) =>
      state.open ? "open" : undefined,
    );
    expect(typeof merged).toBe("function");
    if (typeof merged !== "function") return;
    expect(merged({ open: true })).toBe("base open");
    expect(merged({ open: false })).toBe("base");
  });
});
