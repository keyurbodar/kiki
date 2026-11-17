import { expect, it } from "vitest";
import { phoneLabel, phoneStatus, phoneSubtitle } from "./phone-card-logic.ts";

it("derives neutral phone names and subtitles", () => {
  const phone = {
    machineId: "m",
    os: "ios" as const,
    osVersion: "17.0.0",
    state: "awake",
  };
  expect(phoneLabel(phone)).toBe("iPhone");
  expect(phoneSubtitle(phone)).toBe("iOS 17");
  expect(phoneStatus(phone)).toBe("Awake");
});
