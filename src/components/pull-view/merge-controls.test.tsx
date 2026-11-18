import { describe, expect, it } from "vitest";
import {
  mergeGateCopy,
  mergeMethodLabels,
  mergeMethods,
  toMergeGate,
} from "./merge-controls";

describe("toMergeGate", () => {
  it("blocks a draft pull and names the draft rule", () => {
    const gate = toMergeGate("clean", "draft", ["success"]);
    expect(gate.blocked).toBe(true);
    expect(mergeGateCopy(gate, "main")).toBe(
      "Draft pull requests cannot merge",
    );
  });

  it("treats a dirty mergeable state as a conflict", () => {
    const gate = toMergeGate("dirty", "ready", ["success"]);
    expect(gate.blocked).toBe(true);
    expect(gate.conflicts).toBe(true);
    expect(mergeGateCopy(gate, "main")).toBe("Merge conflicts");
  });

  it("counts failing and pending checks apart", () => {
    const gate = toMergeGate("unstable", "ready", [
      "failure",
      "pending",
      "pending",
      "success",
    ]);
    expect(gate.failing).toBe(1);
    expect(gate.pending).toBe(2);
    expect(gate.blocked).toBe(false);
    expect(mergeGateCopy(gate, "main")).toBe("1 checks failing");
  });

  it("is ready when checks settle and nothing conflicts", () => {
    const gate = toMergeGate("clean", "ready", ["success", "neutral"]);
    expect(gate.blocked).toBe(false);
    expect(gate.failing).toBe(0);
    expect(gate.pending).toBe(0);
    expect(mergeGateCopy(gate, "release")).toBe("Ready to merge into release");
  });
});

describe("merge methods", () => {
  it("names every method the way Capy does", () => {
    expect(
      mergeMethods.map((method) => mergeMethodLabels[method].label),
    ).toEqual(["Squash and merge", "Merge commit", "Rebase and merge"]);
    expect(
      mergeMethods.map((method) => mergeMethodLabels[method].description),
    ).toEqual([
      "Combine all commits",
      "Preserve commit history",
      "Reapply all commits",
    ]);
  });
});
