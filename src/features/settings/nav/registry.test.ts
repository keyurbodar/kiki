import { expect, it } from "vitest";
import { type SettingsNavEntry, sortSettingsNav } from "./registry";

const entry = (
  id: string,
  section: string,
  order: number,
): SettingsNavEntry => ({
  id,
  label: id,
  to: "/settings/general",
  section,
  order,
});

it("orders entries by section, then order, then id", () => {
  const sorted = sortSettingsNav([
    entry("b", "account", 2),
    entry("z", "account", 1),
    entry("a", "account", 2),
    entry("m", "admin", 0),
  ]);
  expect(sorted.map((e) => e.id)).toEqual(["z", "a", "b", "m"]);
});
