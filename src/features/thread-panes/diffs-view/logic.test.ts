import { describe, expect, it } from "vitest";
import {
  availableScopes,
  changedPatchFiles,
  type DiffTurn,
  defaultScope,
  filterTurns,
  groupTurns,
  patchTotals,
  pickTurn,
  rangeLabel,
  turnTitle,
} from "./logic";

const firstTurn: DiffTurn = {
  eventId: "e1",
  repos: [{ repo: "acme/web", scopes: ["turn"] }],
  additions: 3,
  deletions: 1,
  title: "First turn\nwith detail",
};

const secondTurn: DiffTurn = {
  eventId: "e2",
  repos: [{ repo: "acme/web", scopes: ["pr-preview"] }],
  additions: 5,
  deletions: 2,
  title: "Second turn",
};

const turns: DiffTurn[] = [firstTurn, secondTurn];

describe("diffs-view logic", () => {
  it("groups per-event repo rows into turns", () => {
    const grouped = groupTurns([
      firstTurn,
      { ...firstTurn, repos: [{ repo: "acme/api", scopes: ["turn"] }] },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.repos).toHaveLength(2);
    expect(grouped[0]?.additions).toBe(6);
  });

  it("collects scopes and picks a valid default", () => {
    const scopes = availableScopes(turns);
    expect([...scopes].sort()).toEqual(["pr-preview", "turn"]);
    expect(defaultScope(scopes, turns)).toEqual({ scope: "pr-preview" });
    expect(defaultScope(new Set(), turns)).toEqual({
      scope: "turn",
      from: "e2",
      through: "e2",
    });
  });

  it("filters turns by title and position", () => {
    expect(filterTurns(turns, "second").map((entry) => entry.index)).toEqual([
      1,
    ]);
    expect(filterTurns(turns, "turn 1").map((entry) => entry.index)).toEqual([
      0,
    ]);
    expect(turnTitle(firstTurn, 0)).toBe("First turn");
  });

  it("extends the range on shift-click", () => {
    expect(pickTurn(0, 1, 1, true, turns)).toEqual({
      from: "e1",
      through: "e2",
    });
    expect(pickTurn(0, 1, 1, false, turns)).toEqual({
      from: "e1",
      through: "e1",
    });
    expect(rangeLabel(0, 1, 2)).toBe("Turns 1–2 of 2");
  });
});

describe("changedPatchFiles", () => {
  const response = {
    files: [
      {
        path: "src/checkout/retry.ts",
        diff: "@@ -1 +1 @@\n-old\n+new",
        additionCount: 1,
        deletionCount: 1,
      },
      { path: "src/checkout/unchanged.ts", diff: "--- a/\n+++ b/" },
    ],
  };

  it("keeps only changed paths with patches and counts", () => {
    const files = changedPatchFiles(
      response,
      new Set(["src/checkout/retry.ts"]),
    );
    expect(files).toHaveLength(1);
    expect(files[0]?.patch).toContain("+new");
    expect(patchTotals(files)).toEqual({ additions: 1, deletions: 1 });
  });

  it("ignores a response without files", () => {
    expect(changedPatchFiles(undefined, new Set(["a"]))).toEqual([]);
    expect(changedPatchFiles({}, new Set(["a"]))).toEqual([]);
  });
});
