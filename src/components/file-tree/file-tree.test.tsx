import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FileTree } from "./file-tree";

afterEach(cleanup);

const css = readFileSync("src/components/file-tree/file-tree.css", "utf8");
const ROOT_FONT_PX = 16;
const SPACING_PX = 0.25 * ROOT_FONT_PX;

function blockOf(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing ${selector}`);
  return source.slice(start, source.indexOf("}", start));
}

function declared(block: string, name: string) {
  const match = new RegExp(`${name}: ([^;]+);`).exec(block);
  if (match?.[1] === undefined) throw new Error(`missing ${name}`);
  return match[1];
}

function length(value: string) {
  if (value === "var(--capy-tree-zero)") return 0;
  const match = /^calc\(var\(--spacing\) \* ([\d.]+)\)$/.exec(value);
  if (match?.[1] === undefined) throw new Error(`unexpected length ${value}`);
  return Number(match[1]) * SPACING_PX;
}

it("hooks the geometry onto the tree host", () => {
  render(<FileTree paths={["src/a.ts"]} />);
  const host = document.querySelector<HTMLElement>(".capy-tree");
  expect(host?.style.getPropertyValue("--trees-item-height")).toBe("24px");
});

it("declares Capy's row geometry", () => {
  const tree = blockOf(css, ".capy-tree");
  expect(declared(tree, "--capy-tree-zero")).toBe("0rem");
  expect(length(declared(tree, "--capy-tree-indent"))).toBe(16);
  expect(length(declared(tree, "--trees-item-row-gap-override"))).toBe(6);
  expect(length(declared(tree, "--trees-item-padding-x-override"))).toBe(8);
  expect(length(declared(tree, "--trees-padding-inline-override"))).toBe(12);
  expect(length(declared(tree, "--trees-icon-width-override"))).toBe(14);
  expect(length(declared(tree, "--trees-item-margin-x-override"))).toBe(0);
});

it("widens the rows on coarse pointers", () => {
  const coarse = blockOf(
    css.slice(css.indexOf("@media (hover: none) and (pointer: coarse)")),
    ".capy-tree",
  );
  expect(length(declared(coarse, "--trees-item-padding-x-override"))).toBe(12);
  expect(length(declared(coarse, "--capy-tree-indent"))).toBe(20);
});

it("drops the inset inside a popover", () => {
  const popover = blockOf(css, '.capy-tree[data-tree-surface="popover"]');
  expect(length(declared(popover, "--trees-padding-inline-override"))).toBe(0);
  expect(length(declared(popover, "--trees-scrollbar-gutter-override"))).toBe(
    0,
  );
});

/**
 * jsdom reports every element as zero-sized, so pierre's virtualiser mounts no
 * rows. Give elements a real viewport height for the duration of these tests.
 */
const VIEWPORT_HEIGHT = 400;

function stubViewport() {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  const originalClient = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 300,
      height: VIEWPORT_HEIGHT,
      top: 0,
      right: 300,
      bottom: VIEWPORT_HEIGHT,
      left: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => VIEWPORT_HEIGHT,
  });
  return () => {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
    if (originalClient === undefined) {
      Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
    } else {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        originalClient,
      );
    }
  };
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 50));

function selectedRows() {
  const host = document.querySelector<HTMLElement>(".capy-tree");
  const rows = host?.shadowRoot?.querySelectorAll('[role="treeitem"]') ?? [];
  const selected = [...rows]
    .filter((row) => row.getAttribute("aria-selected") === "true")
    .map((row) => row.getAttribute("data-item-path"));
  return { paths: selected, mounted: [...rows].length };
}

it("marks the file the rail is showing, and moves the mark with the prop", async () => {
  const restore = stubViewport();
  try {
    const paths = ["src/a.ts", "src/b.ts", "README.md"];
    const { rerender } = render(
      <FileTree paths={paths} selectedPath="src/b.ts" />,
    );
    await settled();
    expect(selectedRows().paths).toEqual(["src/b.ts"]);

    rerender(<FileTree paths={paths} selectedPath="README.md" />);
    await settled();
    expect(selectedRows().paths).toEqual(["README.md"]);

    rerender(<FileTree paths={paths} selectedPath="src/a.ts" />);
    await settled();
    expect(selectedRows().paths).toEqual(["src/a.ts"]);

    rerender(<FileTree paths={paths} selectedPath="src/missing.ts" />);
    await settled();
    expect(selectedRows().paths).toEqual([]);
  } finally {
    restore();
  }
});

it("leaves selection alone when no file is marked", async () => {
  const restore = stubViewport();
  try {
    render(<FileTree paths={["README.md"]} />);
    await settled();
    expect(selectedRows()).toEqual({ paths: [], mounted: 1 });
  } finally {
    restore();
  }
});
