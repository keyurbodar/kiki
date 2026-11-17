import { describe, expect, it } from "vitest";
import {
  classifyReference,
  isUnverifiable,
  NO_REFERENCE_PNG,
} from "./reference";
import { expandTargets, type Target } from "./targets";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const base = { maxMismatch: 2, threshold: 0.05 };

function firstTarget(file: Parameters<typeof expandTargets>[0]): Target {
  const target = expandTargets(file, base)[0];
  if (!target) throw new Error("expected a target");
  return target;
}

describe("classifyReference", () => {
  it("degrades a 404 to unverified instead of failing", () => {
    expect(
      classifyReference(404, new TextEncoder().encode("<html>404")),
    ).toEqual({ status: "unverified", reason: NO_REFERENCE_PNG });
  });

  it("degrades an empty 200 body to unverified", () => {
    expect(classifyReference(200, new Uint8Array())).toEqual({
      status: "unverified",
      reason: NO_REFERENCE_PNG,
    });
  });

  it("keeps the bytes of a real reference PNG", () => {
    expect(classifyReference(200, png)).toEqual({ status: "ok", bytes: png });
  });

  it("still reports other HTTP failures as errors", () => {
    expect(classifyReference(500, new Uint8Array())).toEqual({
      status: "error",
      message: "HTTP 500",
    });
  });
});

describe("isUnverifiable", () => {
  const target = firstTarget({
    targets: [
      {
        id: "thread",
        route: "/thread/{theme}",
        theme: "default",
        frame: "XYrzNr5Hg7",
        viewport: "1440x818@2",
      },
    ],
  });

  it("flags a frame with no downloaded reference PNG", () => {
    expect(isUnverifiable(target, new Map())).toBe(true);
  });

  it("does not flag a frame that has one", () => {
    expect(
      isUnverifiable(target, new Map([["XYrzNr5Hg7@2", "/tmp/x.png"]])),
    ).toBe(false);
  });

  it("ignores targets without a frame", () => {
    const plain = firstTarget({
      targets: [{ route: "/settings", theme: "default" }],
    });
    expect(isUnverifiable(plain, new Map())).toBe(false);
  });
});
