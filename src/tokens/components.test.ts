import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const ROOT_FONT_PX = 16;

const components = () => readFileSync("src/tokens/components.css", "utf8");

const rightPanelWidth = () =>
  components().match(/--right-panel-width:\s*([\d.]+)rem;/)?.[1];

it("defines the right panel width Capy's thread column and pane read", () => {
  expect(Number(rightPanelWidth()) * ROOT_FONT_PX).toBe(520);
});
