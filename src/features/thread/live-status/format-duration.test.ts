import { expect, it } from "vitest";
import { formatDuration } from "./format-duration";

it("formats summary durations like Capy's clock", () => {
  expect(formatDuration(0)).toBe("1s");
  expect(formatDuration(23_000)).toBe("23s");
  expect(formatDuration(247_000)).toBe("4m 7s");
  expect(formatDuration(120_000)).toBe("2m");
  expect(formatDuration(3_600_000)).toBe("1h");
  expect(formatDuration(3_900_000)).toBe("1h 5m");
});

it("formats latency durations with decimals", () => {
  expect(formatDuration(10_500, "latency")).toBe("10.5s");
  expect(formatDuration(2_340, "latency")).toBe("2.34s");
  expect(formatDuration(420, "latency")).toBe("420ms");
  expect(formatDuration(-1)).toBe("—");
});
