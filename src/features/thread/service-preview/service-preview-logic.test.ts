import { expect, it } from "vitest";
import { isSamePreview, previewDetail } from "./service-preview-logic.ts";

it("maps known preview failures to Capy's copy", () => {
  expect(previewDetail(new Error("capy/ServicePreviewNotFound"))).toBe(
    "Port is not exposed on this thread",
  );
  expect(previewDetail(new Error("capy/InsufficientCredits"))).toBe(
    "Not enough credits to wake the machine",
  );
});

it("compares previews by machine and port", () => {
  expect(
    isSamePreview(
      { machineId: "a", port: "3000" },
      { machineId: "a", port: "3000" },
    ),
  ).toBe(true);
  expect(
    isSamePreview(
      { machineId: "a", port: "3000" },
      { machineId: "a", port: "4000" },
    ),
  ).toBe(false);
});
