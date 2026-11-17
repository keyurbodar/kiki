import { describe, expect, it } from "vitest";
import {
  buildCostRows,
  CREDITS_PER_DOLLAR,
  costHues,
  formatCredits,
  isVisibleCredits,
  parseThreadUsage,
  resourceLines,
  rowHues,
  SEED_HUES,
  subagentPath,
  type ThreadUsage,
  type UsageMember,
} from "./cost";

const member = (
  jamId: string,
  overrides: Partial<UsageMember> = {},
): UsageMember => ({
  jamId,
  familyId: jamId,
  usage: { totalCredits: 0, vmCredits: 0 },
  keyCredits: 0,
  models: [],
  images: [],
  ...overrides,
});

describe("credit formatting", () => {
  it("formats credits as dollars and hides amounts under half a cent", () => {
    expect(CREDITS_PER_DOLLAR).toBe(1000);
    expect(formatCredits(1000)).toBe("$1.00");
    expect(formatCredits(120)).toBe("$0.12");
    expect(isVisibleCredits(4)).toBe(false);
    expect(isVisibleCredits(5)).toBe(true);
  });
});

describe("buildCostRows", () => {
  it("puts this thread first and sorts crew rows by charged plus key credits", () => {
    const usage: ThreadUsage = {
      members: [
        member("jam_root", {
          familyId: "jam_root",
          usage: { totalCredits: 100, vmCredits: 0 },
        }),
        member("jam_big", {
          familyId: "jam_crew_b",
          usage: { totalCredits: 300, vmCredits: 0 },
          keyCredits: 50,
        }),
        member("jam_small", {
          familyId: "jam_crew_a",
          usage: { totalCredits: 200, vmCredits: 0 },
          keyCredits: 20,
        }),
      ],
      crew: [
        { jamId: "jam_crew_a", title: "Acme planning" },
        { jamId: "jam_crew_b", title: null },
        { jamId: "jam_empty", title: "No usage" },
      ],
    };
    expect(
      buildCostRows("jam_root", usage, []).map((row) => [
        row.key,
        row.label,
        row.charged,
        row.onKeys,
      ]),
    ).toEqual([
      ["jam_root", "This thread", 100, 0],
      ["jam_crew_b", "Untitled thread", 300, 50],
      ["jam_crew_a", "Acme planning", 200, 20],
    ]);
  });

  it("sorts subagents by path segments, puts side threads last, and groups unknown members", () => {
    const usage: ThreadUsage = {
      members: [
        member("jam_root", {
          usage: { totalCredits: 10, vmCredits: 0 },
        }),
        member("jam_1", { usage: { totalCredits: 20, vmCredits: 0 } }),
        member("jam_1_2", { usage: { totalCredits: 30, vmCredits: 0 } }),
        member("jam_2", { usage: { totalCredits: 40, vmCredits: 0 } }),
        member("jam_side", { usage: { totalCredits: 50, vmCredits: 0 } }),
        member("jam_other", { usage: { totalCredits: 60, vmCredits: 0 } }),
        member("jam_other_2", { usage: { totalCredits: 70, vmCredits: 0 } }),
      ],
      crew: [],
    };
    const rows = buildCostRows("jam_root", usage, [
      { id: "jam_1", localIndex: 1, parentJamId: "jam_root" },
      { id: "jam_1_2", localIndex: 2, parentJamId: "jam_1" },
      { id: "jam_2", localIndex: 2, parentJamId: "jam_root" },
      { id: "jam_side", localIndex: null, parentJamId: "jam_other_root" },
    ]);
    expect(rows.map((row) => [row.key, row.label])).toEqual([
      ["jam_root", "This thread"],
      ["jam_1", "Subagent 1"],
      ["jam_1_2", "Subagent 1.2"],
      ["jam_2", "Subagent 2"],
      ["jam_side", "Side thread"],
      ["other", "Other"],
    ]);
    expect(rows.at(-1)?.members.map((m) => m.jamId)).toEqual([
      "jam_other",
      "jam_other_2",
    ]);
  });
});

describe("subagentPath", () => {
  it("walks parent links and rejects nodes without a path to the root", () => {
    const subtree = [
      { id: "jam_1", localIndex: 1, parentJamId: "jam_root" },
      { id: "jam_1_2", localIndex: 2, parentJamId: "jam_1" },
      { id: "jam_side", localIndex: null, parentJamId: "jam_elsewhere" },
    ];
    expect(subagentPath(subtree, "jam_root", "jam_1_2")).toBe("1.2");
    expect(subagentPath(subtree, "jam_root", "jam_side")).toBeNull();
    expect(subagentPath(subtree, "jam_root", "jam_missing")).toBeNull();
  });
});

describe("costHues and rowHues", () => {
  it("starts with the seed hues and puts the next hue in the widest gap", () => {
    expect(costHues(10)).toEqual(SEED_HUES);
    const eleven = costHues(11);
    const sorted = [...SEED_HUES].sort((a, b) => a - b);
    const widest = sorted
      .map((hue, i) => ({
        hue,
        gap: (sorted[i + 1] ?? sorted[0] + 360) - hue,
      }))
      .reduce((best, next) => (next.gap > best.gap ? next : best));
    expect(eleven[10]).toBe((widest.hue + widest.gap / 2) % 360);
  });

  it("assigns hues by key order", () => {
    const hues = rowHues([
      {
        key: "jam_b",
        label: "B",
        members: [],
        charged: 0,
        onKeys: 0,
      },
      {
        key: "jam_a",
        label: "A",
        members: [],
        charged: 0,
        onKeys: 0,
      },
    ]);
    expect(hues.get("jam_a")).toBe(SEED_HUES[0]);
    expect(hues.get("jam_b")).toBe(SEED_HUES[1]);
  });
});

describe("resourceLines", () => {
  it("sums machines, sorts billed and unbilled lines, and drops invisible credits", () => {
    const lines = resourceLines([
      member("jam_root", {
        usage: { totalCredits: 0, vmCredits: 120 },
        models: [
          {
            entryId: "jam_model_small",
            label: "Small model",
            unbilled: false,
            credentialName: null,
            credits: 4,
            tokenFeeCredits: 0,
          },
          {
            entryId: "jam_model_b",
            label: "Big model",
            unbilled: false,
            credentialName: null,
            credits: 300,
            tokenFeeCredits: 20,
          },
          {
            entryId: "jam_model_key",
            label: "Key model",
            unbilled: true,
            credentialName: "Acme key",
            credits: 100,
            tokenFeeCredits: 5,
          },
        ],
        images: [
          { endpoint: "jam_image", label: "Image model", credits: 250 },
          { endpoint: "jam_image_small", label: "Tiny image", credits: 4 },
        ],
      }),
      member("jam_1", {
        usage: { totalCredits: 0, vmCredits: 30 },
        models: [
          {
            entryId: "jam_model_b",
            label: "Big model",
            unbilled: false,
            credentialName: null,
            credits: 50,
            tokenFeeCredits: 10,
          },
        ],
      }),
    ]);
    expect(lines.machines).toBe(150);
    expect(lines.tokenFee).toBe(35);
    expect(lines.billed.map((line) => [line.label, line.credits])).toEqual([
      ["Big model", 350],
    ]);
    expect(lines.unbilled.map((line) => [line.label, line.credits])).toEqual([
      ["Key model", 100],
    ]);
    expect(lines.images).toEqual([
      { endpoint: "jam_image", label: "Image model", credits: 250 },
    ]);
  });
});

describe("parseThreadUsage", () => {
  it("rejects non-objects and rows without a members array", () => {
    expect(parseThreadUsage(null)).toBeNull();
    expect(parseThreadUsage("jam_sample_usage")).toBeNull();
    expect(parseThreadUsage({ crew: [] })).toBeNull();
  });

  it("defaults a missing familyId to the jam id and normalizes fields", () => {
    const parsed = parseThreadUsage({
      members: [
        {
          jamId: "jam_root",
          usage: { totalCredits: 10, vmCredits: 2 },
          keyCredits: 3,
        },
        {
          jamId: "jam_1",
          familyId: "jam_crew",
          models: [{ entryId: "jam_model", label: "Acme model" }],
        },
        "jam_sample_bad",
      ],
      crew: [{ jamId: "jam_crew", title: null }, "jam_sample_bad"],
    });
    expect(parsed).toEqual({
      members: [
        {
          jamId: "jam_root",
          familyId: "jam_root",
          usage: { totalCredits: 10, vmCredits: 2 },
          keyCredits: 3,
          models: [],
          images: [],
        },
        {
          jamId: "jam_1",
          familyId: "jam_crew",
          usage: { totalCredits: 0, vmCredits: 0 },
          keyCredits: 0,
          models: [
            {
              entryId: "jam_model",
              label: "Acme model",
              unbilled: false,
              credentialName: null,
              credits: 0,
              tokenFeeCredits: 0,
            },
          ],
          images: [],
        },
      ],
      crew: [{ jamId: "jam_crew", title: null }],
    });
  });
});
