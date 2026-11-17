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
