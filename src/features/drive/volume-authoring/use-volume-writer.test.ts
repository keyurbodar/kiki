import { describe, expect, it } from "vitest";
import { writeFailure } from "./use-volume-writer";

describe("writeFailure", () => {
  it("reads drive-full facts", () => {
    expect(
      writeFailure(
        { _tag: "capy/DriveFull", usedBytes: 10, limitBytes: 10, tier: "pro" },
        "Could not save file",
      ),
    ).toEqual({
      kind: "full",
      facts: { usedBytes: 10, limitBytes: 10, tier: "pro" },
    });
  });

  it("reads moved heads and rejections", () => {
    expect(
      writeFailure(
        { _tag: "capy/VolumeHeadMoved", paths: ["a.md"] },
        "Could not save file",
      ),
    ).toEqual({ kind: "moved", paths: ["a.md"] });
    expect(
      writeFailure(
        { _tag: "capy/VolumeWriteRejected", message: "Path too long" },
        "Could not save file",
      ),
    ).toEqual({ kind: "error", message: "Path too long" });
  });

  it("falls back to the caller's copy", () => {
    expect(writeFailure(new Error("boom"), "Could not create file")).toEqual({
      kind: "error",
      message: "Could not create file",
    });
  });
});
