import { describe, expect, it } from "vitest";
import {
  clampSplitRatio,
  defaultTiles,
  hasShownTile,
  layoutTiles,
  MAIN_TILE,
  MIN_TILE_SIZE,
  measureSplit,
  minTileSize,
  removeTile,
  SIDE_TILE,
  setTileRatio,
  splitTile,
  type TileNode,
  tileLeafIds,
  tileNodeAt,
  tileRatioVars,
} from "./tiles";

const alwaysShown = () => true;
const main = { kind: "group" as const, id: MAIN_TILE };
const a = { kind: "group" as const, id: "a" };
const b = { kind: "group" as const, id: "b" };
const inner = {
  kind: "split" as const,
  axis: "column" as const,
  ratio: 0.4,
  first: a,
  second: b,
};
const nested: TileNode = {
  kind: "split",
  axis: "row",
  ratio: 0.62,
  first: main,
  second: inner,
};

describe("layoutTiles", () => {
  it("lays out the default row with ratio custom properties", () => {
    const layout = layoutTiles(defaultTiles, alwaysShown);
    expect(layout.leaves).toEqual([
      {
        id: "main",
        rect: {
          left: "0%",
          top: "0%",
          width: "calc(100% * var(--tile-r))",
          height: "100%",
        },
      },
      {
        id: "side",
        rect: {
          left: "calc(0% + 100% * var(--tile-r))",
          top: "0%",
          width: "calc(100% * (1 - var(--tile-r)))",
          height: "100%",
        },
      },
    ]);
    expect(layout.splits).toEqual([
      { path: "", axis: "row", ratio: 0.62, rect: fullRect() },
    ]);
  });

  it("drops a hidden side's split and gives the rest the full rect", () => {
    expect(layoutTiles(defaultTiles, (id) => id !== SIDE_TILE)).toEqual({
      leaves: [{ id: "main", rect: fullRect() }],
      splits: [],
    });
  });

  it("numbers nested split paths and ratio variables", () => {
    expect(layoutTiles(nested, alwaysShown).splits.map((s) => s.path)).toEqual([
      "",
      "1",
    ]);
    expect(tileRatioVars(nested)).toEqual([
      ["--tile-r", 0.62],
      ["--tile-r1", 0.4],
    ]);
  });
});

const fullRect = () => ({
  left: "0%",
  top: "0%",
  width: "100%",
  height: "100%",
});

describe("measureSplit", () => {
  const box = { left: 0, top: 0, width: 1000, height: 500 };

  it("measures each side of the default row", () => {
    expect(measureSplit(defaultTiles, "0", box, alwaysShown)).toEqual({
      ...box,
      width: 620,
    });
    expect(measureSplit(defaultTiles, "1", box, alwaysShown)).toEqual({
      ...box,
      left: 620,
      width: 380,
    });
  });

  it("gives the full box to a side whose sibling is hidden", () => {
    expect(
      measureSplit(defaultTiles, "0", box, (id) => id !== SIDE_TILE),
    ).toEqual(box);
  });
});

describe("minTileSize", () => {
  it("uses one minimum for a leaf and splits it by the ratio", () => {
    expect(minTileSize(main, "row", alwaysShown)).toBe(MIN_TILE_SIZE);
    expect(minTileSize(defaultTiles, "row", alwaysShown)).toBeCloseTo(
      MIN_TILE_SIZE / 0.38,
    );
    expect(minTileSize(defaultTiles, "column", alwaysShown)).toBe(
      MIN_TILE_SIZE,
    );
  });

  it("doubles the minimum for an even row split only", () => {
    const even: TileNode = {
      kind: "split",
      axis: "row",
      ratio: 0.5,
      first: main,
      second: a,
    };
    expect(minTileSize(even, "row", alwaysShown)).toBe(320);
    expect(minTileSize(even, "column", alwaysShown)).toBe(MIN_TILE_SIZE);
  });
});

describe("tree helpers", () => {
  it("finds nodes by path and lists their leaves", () => {
    expect(tileNodeAt(nested, "")).toBe(nested);
    expect(tileNodeAt(nested, "1")).toBe(inner);
    expect(tileNodeAt(nested, "10")).toBe(a);
    expect(tileLeafIds(nested)).toEqual(["main", "a", "b"]);
  });

  it("reports whether any leaf under a node is shown", () => {
    expect(hasShownTile(nested, (id) => id === "b")).toBe(true);
    expect(hasShownTile(nested, (id) => id === SIDE_TILE)).toBe(false);
    expect(hasShownTile(main, alwaysShown)).toBe(true);
  });

  it("clamps ratios and preserves an unchanged tree", () => {
    expect(setTileRatio(defaultTiles, "", 2).kind).toBe("split");
    const low = setTileRatio(defaultTiles, "", 0.01);
    const high = setTileRatio(defaultTiles, "", 0.99);
    expect(low.kind === "split" && low.ratio).toBe(0.1);
    expect(high.kind === "split" && high.ratio).toBe(0.9);
    expect(setTileRatio(defaultTiles, "", 0.62)).toBe(defaultTiles);
    const updated = setTileRatio(nested, "11", 0.2);
    expect(
      updated.kind === "split" &&
        updated.second.kind === "split" &&
        updated.second.second.kind === "group" &&
        updated.second.second,
    ).toEqual(b);
  });
});

describe("clampSplitRatio", () => {
  it("keeps a ratio between both minimum sizes", () => {
    expect(clampSplitRatio(0.5, 1000, 200, 200)).toBe(0.5);
    expect(clampSplitRatio(0.05, 1000, 200, 200)).toBe(0.2);
    expect(clampSplitRatio(0.95, 1000, 200, 200)).toBe(0.8);
  });

  it("weights the ratio when the split cannot fit both minimums", () => {
    expect(clampSplitRatio(0.5, 300, 200, 100)).toBeCloseTo(2 / 3);
  });
});

describe("splitTile", () => {
  it("puts the new tile after the split one on the right", () => {
    const split = splitTile(a, "a", "right", "b");
    expect(split).toEqual({
      kind: "split",
      axis: "row",
      ratio: 0.5,
      first: a,
      second: b,
    });
  });

  it("puts the new tile after the split one below it", () => {
    const split = splitTile(a, "a", "bottom", "b");
    expect(split).toEqual({
      kind: "split",
      axis: "column",
      ratio: 0.5,
      first: a,
      second: b,
    });
  });

  it("puts the new tile first on the left and on top", () => {
    const left = splitTile(a, "a", "left", "b");
    const top = splitTile(a, "a", "top", "b");
    expect(left.kind === "split" && left.first).toEqual(b);
    expect(left.kind === "split" && left.second).toEqual(a);
    expect(top.kind === "split" && top.axis).toBe("column");
    expect(top.kind === "split" && top.first).toEqual(b);
  });

  it("splits a tile inside a nested tree and leaves the rest alone", () => {
    const split = splitTile(nested, "b", "right", "c");
    expect(split.kind === "split" && split.first).toEqual(main);
    const innerSplit =
      split.kind === "split" && split.second.kind === "split"
        ? split.second
        : undefined;
    expect(innerSplit?.second.kind).toBe("split");
    expect(tileLeafIds(split)).toEqual(["main", "a", "b", "c"]);
  });

  it("returns the same tree when the tile is not there", () => {
    expect(splitTile(nested, "missing", "right", "c")).toBe(nested);
  });
});

describe("removeTile", () => {
  it("gives the whole box to the tile left beside it", () => {
    const split: TileNode = splitTile(a, "a", "right", "b");
    expect(removeTile(split, "b")).toEqual(a);
    expect(removeTile(split, "a")).toEqual(b);
  });

  it("collapses only the pair the tile left, keeping deeper splits", () => {
    const split = splitTile(nested, "b", "bottom", "c");
    const removed = removeTile(split, "c");
    expect(tileLeafIds(removed ?? (null as never))).toEqual(["main", "a", "b"]);
  });

  it("leaves no tile behind when the last one goes", () => {
    expect(removeTile(a, "a")).toBeNull();
  });

  it("returns the same tree when the tile is not there", () => {
    expect(removeTile(nested, "missing")).toBe(nested);
  });
});
