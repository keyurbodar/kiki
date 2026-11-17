import { Combobox } from "@base-ui/react/combobox";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  MenuCombobox,
  MenuComboboxContent,
  MenuComboboxGroup,
  MenuComboboxGroupLabel,
  MenuComboboxItem,
  MenuComboboxTrigger,
} from "./menu-combobox";

afterEach(cleanup);

const labels = ["bug", "design", "docs"];
const groups = [{ value: "Labels", items: labels }];

function renderCombobox(
  props: Partial<Parameters<typeof MenuComboboxContent>[0]> = {},
) {
  return render(
    <MenuCombobox items={groups} defaultOpen>
      <MenuComboboxTrigger variant="ghost" size="sm">
        Add labels
      </MenuComboboxTrigger>
      <MenuComboboxContent {...props}>
        {(group: (typeof groups)[number]) => (
          <MenuComboboxGroup key={group.value} items={group.items}>
            <MenuComboboxGroupLabel>{group.value}</MenuComboboxGroupLabel>
            <Combobox.Collection>
              {(label: string) => (
                <MenuComboboxItem key={label} value={label}>
                  {label}
                </MenuComboboxItem>
              )}
            </Combobox.Collection>
          </MenuComboboxGroup>
        )}
      </MenuComboboxContent>
    </MenuCombobox>,
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("MenuCombobox", () => {
  it("renders the search row, list and Capy's defaults", async () => {
    renderCombobox();
    await act(async () => {});
    const content = slot("menu-combobox-content");
    expect(content?.className).toContain("min-w-32");
    expect(content?.className).not.toContain("min-w-(--anchor-width)");
    const input = screen.getByPlaceholderText("Search...");
    expect(input.className).toContain("placeholder:text-muted-foreground-3");
    expect(input.closest('[data-slot="menu-search-row"]')).not.toBeNull();
    expect(slot("menu-combobox-group")?.className).toBe(
      "flex flex-col [&+&]:mt-1",
    );
    expect(slot("menu-combobox-group-label")?.textContent).toBe("Labels");
    expect(
      document.querySelectorAll('[data-slot="menu-combobox-item"]'),
    ).toHaveLength(3);
    expect(slot("menu-combobox-footer")).toBeNull();
  });

  it("only styles the trigger as a button when a variant or size is set", () => {
    render(
      <MenuCombobox items={labels}>
        <MenuComboboxTrigger className="custom">Pick</MenuComboboxTrigger>
      </MenuCombobox>,
    );
    expect(slot("menu-combobox-trigger")?.className).toBe("custom");
  });

  it("shows the empty copy when the search matches nothing", async () => {
    renderCombobox();
    await act(async () => {});
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "zzz" },
    });
    await act(async () => {});
    expect(screen.getByText("No results found").className).toContain(
      "empty:hidden",
    );
  });

  it("takes a custom placeholder, empty text and footer", async () => {
    renderCombobox({
      searchPlaceholder: "Search labels",
      emptyText: "No results",
      footer: <button type="button">Create label</button>,
    });
    await act(async () => {});
    expect(screen.getByPlaceholderText("Search labels")).not.toBeNull();
    const footer = slot("menu-combobox-footer");
    expect(footer?.className).toBe("shrink-0");
    expect(footer?.firstElementChild?.className).toBe(
      "-mx-1 my-1 h-px bg-border-1",
    );
    expect(footer?.textContent).toBe("Create label");
  });
});
