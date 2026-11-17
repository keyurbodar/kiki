import { expect, it } from "vitest";
import { formatStamp } from "./format-stamp";

const now = new Date(2026, 5, 10, 15, 0).getTime();
const time = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

it("shows only the time for today", () => {
  const at = new Date(2026, 5, 10, 7, 51);
  expect(formatStamp(at, now)).toBe(time.format(at));
});

it("prefixes yesterday", () => {
  const at = new Date(2026, 5, 9, 22, 5);
  expect(formatStamp(at, now)).toBe(`Yesterday ${time.format(at)}`);
});

it("uses the weekday within six days and the date after that", () => {
  const recent = new Date(2026, 5, 6, 10, 0);
  const older = new Date(2026, 4, 1, 10, 0);
  expect(formatStamp(recent, now)).not.toContain("2026");
  expect(formatStamp(recent, now)).not.toBe(time.format(recent));
  expect(formatStamp(older, now)).not.toContain("2026");
  expect(formatStamp(new Date(2025, 4, 1, 10, 0), now)).toContain("2025");
});
