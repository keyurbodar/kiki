import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { COLOR_THEME_IDS } from "./theme";

it("keeps the pre-paint preset list in index.html in sync with theme.ts", () => {
  const html = readFileSync("index.html", "utf8");
  const list = html.match(/const presets = (\[[^\]]*\])/)?.[1];
  expect(list && JSON.parse(list)).toEqual([...COLOR_THEME_IDS]);
});
