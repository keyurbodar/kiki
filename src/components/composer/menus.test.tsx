import { cleanup, render } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CommandMenuSurface, SKILLS_COMMAND } from "./command-menu";
import { MentionMenuSurface } from "./mention-menu";
import type {
  CommandRow,
  MentionItem,
  MentionMenuState,
  MentionSource,
} from "./types";

afterEach(cleanup);

const SourceIcon: ComponentType = () => <span data-testid="source-icon" />;

const source: MentionSource = {
  category: "files",
  kind: "file",
  label: "Files",
  description: "Files and folders on the device",
  icon: SourceIcon,
  search: () => [],
};

const state = (
  rows: MentionMenuState["rows"],
  overrides: Partial<MentionMenuState> = {},
): MentionMenuState => ({
  rows,
  headers: new Map(),
  empty: null,
  loading: false,
  notice: null,
  ...overrides,
});

const menu = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[role="listbox"]') as HTMLElement;

describe("command menu surface", () => {
  const rows: CommandRow[] = [
    { type: "back" },
    {
      type: "command",
      command: {
        kind: "action",
        name: "plan",
        label: "Plan mode",
        run: () => {},
      },
    },
    {
      type: "command",
      command: { kind: "insert", name: "new", label: "New thread", text: "" },
    },
    { type: "skills", source },
  ];

  it("is a 320px surface bounded by the menu max height", () => {
    const { container } = render(
      <CommandMenuSurface
        rows={rows}
        command={null}
        loading={false}
        empty={null}
        highlight={1}
      />,
    );
    const surface = menu(container);
    expect(surface.id).toBe("capy-command-menu");
    expect(surface.className).toContain("bg-popover");
    expect(surface.className).toContain("p-1");
    expect(surface.style.width).toBe("320px");
    expect(surface.style.maxHeight).toBe("320px");
  });

  it("marks one row selected and highlighted, keyed by its row id", () => {
    const { container } = render(
      <CommandMenuSurface
        rows={rows}
        command={null}
        loading={false}
        empty={null}
        highlight={1}
      />,
    );
    const options = [...container.querySelectorAll('[role="option"]')];
    expect(options.map((option) => option.id)).toEqual([
      "capy-command-row-0",
      "capy-command-row-1",
      "capy-command-row-2",
      "capy-command-row-3",
    ]);
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
    expect(options[1]?.getAttribute("data-highlighted")).toBe("");
    expect(options[0]?.getAttribute("data-highlighted")).toBeNull();
    for (const option of options)
      expect(option.getAttribute("role")).toBe("option");
  });

  it("gives command rows the menu row height and skill rows the rich density", () => {
    const { container } = render(
      <CommandMenuSurface
        rows={[
          {
            type: "skill",
            source,
            item: {
              kind: "skill",
              id: "skill-1",
              label: "Review",
              subtitle: "Check a diff",
            },
          },
        ]}
        command={SKILLS_COMMAND}
        loading={false}
        empty={null}
        highlight={0}
      />,
    );
    const option = container.querySelector<HTMLElement>('[role="option"]');
    const classes = option?.className.split(" ") ?? [];
    expect(classes).toEqual(
      expect.arrayContaining(["h-auto", "min-h-9", "py-1"]),
    );
    expect(classes).not.toContain("h-(--h-menu-row)");
    expect(container.textContent).toContain("Check a diff");
  });

  it("labels the scoped command above the rows", () => {
    const { container } = render(
      <CommandMenuSurface
        rows={rows}
        command="plan"
        loading={false}
        empty={null}
        highlight={1}
      />,
    );
    const label = container.querySelector<HTMLElement>(
      "[role=presentation] > div",
    );
    expect(label?.textContent).toBe("/plan");
    expect(label?.className).toContain("min-h-(--h-menu-group-label)");
    expect(label?.className).toContain("first:mt-0");
  });

  it("reports the picker's empty state and hosts the trailing affordances", () => {
    const { container, rerender } = render(
      <CommandMenuSurface
        rows={[{ type: "back" }]}
        command={null}
        loading
        empty={null}
        highlight={0}
      />,
    );
    expect(container.textContent).toContain("Loading…");
    rerender(
      <CommandMenuSurface
        rows={[{ type: "back" }]}
        command={null}
        loading={false}
        empty="No commands found"
        highlight={0}
      />,
    );
    expect(container.textContent).toContain("No commands found");
    expect(container.textContent).toContain("Back to commands");
    expect(container.textContent).toContain("Backspace");
  });
});

describe("mention menu surface", () => {
  it("is a 320px surface bounded at the mention max height", () => {
    const { container } = render(
      <MentionMenuSurface
        state={state([{ type: "category", source }])}
        highlight={0}
      />,
    );
    const surface = menu(container);
    expect(surface.id).toBe("capy-mention-menu");
    expect(surface.style.width).toBe("320px");
    expect(surface.style.maxHeight).toBe("480px");
  });

  it("renders categories as rich rows with a chevron", () => {
    const { container } = render(
      <MentionMenuSurface
        state={state([{ type: "category", source }])}
        highlight={0}
      />,
    );
    const option = container.querySelector<HTMLElement>('[role="option"]');
    const classes = option?.className.split(" ") ?? [];
    expect(classes).toEqual(
      expect.arrayContaining(["h-auto", "min-h-9", "py-1"]),
    );
    expect(container.textContent).toContain("Files");
    expect(container.textContent).toContain("Files and folders on the device");
    expect(container.querySelector('[role="option"] svg')).not.toBeNull();
  });

  it("falls back to the file icon for files and to the source icon otherwise", () => {
    const fileItem: MentionItem = { kind: "file", id: "f1", label: "plan.md" };
    const { container, rerender } = render(
      <MentionMenuSurface
        state={state([{ type: "item", item: fileItem, source }])}
        highlight={0}
      />,
    );
    expect(container.querySelector('[data-slot="file-icon"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="source-icon"]')).toBeNull();

    rerender(
      <MentionMenuSurface
        state={state([
          {
            type: "item",
            item: { ...fileItem, kind: "thread", id: "t1" },
            source,
          },
        ])}
        highlight={0}
      />,
    );
    expect(container.querySelector('[data-slot="file-icon"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="source-icon"]'),
    ).not.toBeNull();
  });

  it("prefers the item's own leading icon over the source icon", () => {
    const { container } = render(
      <MentionMenuSurface
        state={state([
          {
            type: "item",
            item: {
              kind: "file",
              id: "f2",
              label: "notes.md",
              leading: <span data-testid="leading" />,
            },
            source,
          },
        ])}
        highlight={0}
      />,
    );
    expect(container.querySelector('[data-testid="leading"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="file-icon"]')).toBeNull();
  });

  it("puts the state message above the rows and the notice below them", () => {
    const { container } = render(
      <MentionMenuSurface
        state={state([{ type: "category", source }], {
          empty: "No matches",
          notice: "Showing recent items",
        })}
        highlight={0}
      />,
    );
    const list = container.querySelector<HTMLElement>("[role=presentation]");
    const children = [...(list?.children ?? [])].map((child) =>
      child.textContent?.trim(),
    );
    expect(children[0]).toBe("No matches");
    expect(children.at(-1)).toBe("Showing recent items");
  });

  it("marks the rows it is given as headers", () => {
    const { container } = render(
      <MentionMenuSurface
        state={state(
          [
            {
              type: "item",
              item: { kind: "thread", id: "t1", label: "One" },
              source,
            },
            {
              type: "item",
              item: { kind: "thread", id: "t2", label: "Two" },
              source,
            },
          ],
          { headers: new Map([[1, "Recent"]]) },
        )}
        highlight={0}
      />,
    );
    const labels = [...container.querySelectorAll<HTMLElement>("div")].filter(
      (node) => node.className.includes("min-h-(--h-menu-group-label)"),
    );
    expect(labels.map((node) => node.textContent)).toEqual(["Recent"]);
  });
});
