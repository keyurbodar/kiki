import { expect, it } from "vitest";
import { desktopCopy, isLive } from "./desktop-view-logic.ts";

it("shows the asleep copy for a local machine and a retry for a missing one", () => {
  expect(
    desktopCopy({ machineId: "m", state: "asleep", device: null }, false)?.line,
  ).toBe("Machine is asleep");
  expect(desktopCopy(undefined, true)).toEqual({
    line: "Machine state unavailable",
    action: "Retry",
  });
  expect(desktopCopy(undefined, false)).toBeUndefined();
});

it("treats waking as live only after the optimistic wake", () => {
  const waking = { machineId: "m", state: "waking" as const };
  expect(isLive(waking, false)).toBe(false);
  expect(isLive(waking, true)).toBe(true);
});
