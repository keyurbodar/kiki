import { expect, it } from "vitest";
import { phoneDeviceSize, phoneNotice } from "./phone-view-logic.ts";

it("sizes iPhones in portrait and folds foldables", () => {
  expect(
    phoneDeviceSize({ machineId: "m", state: "awake", phone: { os: "ios" } }),
  ).toEqual({ width: 402, height: 874 });
  expect(
    phoneDeviceSize(
      { machineId: "m", state: "awake", phone: { model: "Pixel Fold" } },
      true,
    ),
  ).toEqual({ width: 280, height: 344 });
});

it("builds the asleep notice", () => {
  expect(
    phoneNotice({ machineId: "m", state: "asleep", phone: {} }).title,
  ).toBe("Phone asleep");
});
