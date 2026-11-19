export type TileAxis = "row" | "column";

/** Where a split puts the new tile, as Capy's four drop zones name it. */
export type TileDirection = "left" | "right" | "top" | "bottom";

export type TileNode =
  | { kind: "group"; id: string }
  | {
      kind: "split";
      axis: TileAxis;
      ratio: number;
      first: TileNode;
      second: TileNode;
    };

/** A tile's box as CSS lengths, relative to the surface. */
export type TileRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** A tile's box in pixels, as measured from the DOM. */
export type TileBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TileSplit = {
  path: string;
  axis: TileAxis;
  ratio: number;
  rect: TileRect;
};

export type TileLayout = {
  leaves: { id: string; rect: TileRect }[];
  splits: TileSplit[];
};

type Shown = (id: string) => boolean;

export const MAIN_TILE = "main";
export const SIDE_TILE = "side";
export const DEFAULT_SIDE_RATIO = 0.62;
export const MIN_TILE_SIZE = 160;
export const MIN_TILE_RATIO = 0.1;
export const MAX_TILE_RATIO = 0.9;
export const TILE_RATIO_STEP = 0.02;
export const TILE_RATIO_STEP_LARGE = 0.1;

export const defaultTiles: TileNode = {
  kind: "split",
  axis: "row",
  ratio: DEFAULT_SIDE_RATIO,
  first: { kind: "group", id: MAIN_TILE },
  second: { kind: "group", id: SIDE_TILE },
};

export const fullTileRect: TileRect = {
  left: "0%",
  top: "0%",
  width: "100%",
  height: "100%",
};

/** CSS custom property holding the ratio of the split at `path`. */
export const tileRatioVar = (path: string) => `--tile-r${path}`;

export const tileLeafIds = (node: TileNode): string[] =>
  node.kind === "group"
    ? [node.id]
    : [...tileLeafIds(node.first), ...tileLeafIds(node.second)];

export const hasShownTile = (node: TileNode, shown: Shown): boolean =>
  node.kind === "group"
    ? shown(node.id)
    : hasShownTile(node.first, shown) || hasShownTile(node.second, shown);

/**
 * Lays the tree out as CSS rects. A split whose side has no shown tile gives
 * the whole rect to the other side and draws no divider.
 */
export const layoutTiles = (
  node: TileNode,
  shown: Shown,
  rect: TileRect = fullTileRect,
  path = "",
): TileLayout => {
  if (node.kind === "group") {
    return { leaves: [{ id: node.id, rect }], splits: [] };
  }
  if (!hasShownTile(node.first, shown)) {
    return layoutTiles(node.second, shown, rect, `${path}1`);
  }
  if (!hasShownTile(node.second, shown)) {
    return layoutTiles(node.first, shown, rect, `${path}0`);
  }
  const ratio = `var(${tileRatioVar(path)})`;
  const [first, second]: [TileRect, TileRect] =
    node.axis === "row"
      ? [
          { ...rect, width: `calc(${rect.width} * ${ratio})` },
          {
            ...rect,
            left: `calc(${rect.left} + ${rect.width} * ${ratio})`,
            width: `calc(${rect.width} * (1 - ${ratio}))`,
          },
        ]
      : [
          { ...rect, height: `calc(${rect.height} * ${ratio})` },
          {
            ...rect,
            top: `calc(${rect.top} + ${rect.height} * ${ratio})`,
            height: `calc(${rect.height} * (1 - ${ratio}))`,
          },
        ];
  const a = layoutTiles(node.first, shown, first, `${path}0`);
  const b = layoutTiles(node.second, shown, second, `${path}1`);
  return {
    leaves: [...a.leaves, ...b.leaves],
    splits: [
      { path, axis: node.axis, ratio: node.ratio, rect },
      ...a.splits,
      ...b.splits,
    ],
  };
};

/** The pixel box of the split at `path`, given the surface's box. */
export const measureSplit = (
  node: TileNode,
  path: string,
  box: TileBox,
  shown: Shown,
): TileBox => {
  if (node.kind === "group" || path === "") return box;
  const intoFirst = path.startsWith("0");
  if (!hasShownTile(intoFirst ? node.second : node.first, shown)) {
    return measureSplit(
      intoFirst ? node.first : node.second,
      path.slice(1),
      box,
      shown,
    );
  }
  const row = node.axis === "row";
  const size = row ? box.width : box.height;
  const cut = size * node.ratio;
  const next: TileBox = row
    ? {
        ...box,
        left: intoFirst ? box.left : box.left + cut,
        width: intoFirst ? cut : size - cut,
      }
    : {
        ...box,
        top: intoFirst ? box.top : box.top + cut,
        height: intoFirst ? cut : size - cut,
      };
  return measureSplit(
    intoFirst ? node.first : node.second,
    path.slice(1),
    next,
    shown,
  );
};

/** The smallest size along `axis` that keeps every shown tile usable. */
export const minTileSize = (
  node: TileNode,
  axis: TileAxis,
  shown: Shown,
): number => {
  if (node.kind === "group") return MIN_TILE_SIZE;
  if (!hasShownTile(node.first, shown))
    return minTileSize(node.second, axis, shown);
  if (!hasShownTile(node.second, shown))
    return minTileSize(node.first, axis, shown);
  const a = minTileSize(node.first, axis, shown);
  const b = minTileSize(node.second, axis, shown);
  return node.axis === axis
    ? Math.max(a / node.ratio, b / (1 - node.ratio))
    : Math.max(a, b);
};

/** Every split's ratio as [custom property, value] pairs. */
export const tileRatioVars = (node: TileNode, path = ""): [string, number][] =>
  node.kind === "group"
    ? []
    : [
        [tileRatioVar(path), node.ratio],
        ...tileRatioVars(node.first, `${path}0`),
        ...tileRatioVars(node.second, `${path}1`),
      ];

/**
 * Splits the tile `id` in two, putting a new tile `newId` on `direction`'s
 * side at `ratio`, as Capy does: the split is a row for a side-by-side pair and
 * a column for a stacked one, and the split tile keeps its own subtree.
 */
export const splitTile = (
  node: TileNode,
  id: string,
  direction: TileDirection,
  newId: string,
  ratio = 0.5,
): TileNode => {
  if (node.kind === "split") {
    const first = splitTile(node.first, id, direction, newId, ratio);
    const second = splitTile(node.second, id, direction, newId, ratio);
    return first === node.first && second === node.second
      ? node
      : { ...node, first, second };
  }
  if (node.id !== id) return node;
  const fresh: TileNode = { kind: "group", id: newId };
  const before = direction === "left" || direction === "top";
  return {
    kind: "split",
    axis: direction === "left" || direction === "right" ? "row" : "column",
    ratio,
    first: before ? fresh : node,
    second: before ? node : fresh,
  };
};

/**
 * Drops a tile out of the tree. A split left with one side collapses into that
 * side, so the tile that shared it takes the whole box; the last tile leaves
 * `null`.
 */
export const removeTile = (node: TileNode, id: string): TileNode | null => {
  if (node.kind === "group") return node.id === id ? null : node;
  const first = removeTile(node.first, id);
  const second = removeTile(node.second, id);
  if (first === null) return second;
  if (second === null) return first;
  return first === node.first && second === node.second
    ? node
    : { ...node, first, second };
};

export const tileNodeAt = (node: TileNode, path: string): TileNode =>
  path === "" || node.kind === "group"
    ? node
    : tileNodeAt(
        path.startsWith("0") ? node.first : node.second,
        path.slice(1),
      );

export const clampTileRatio = (ratio: number) =>
  Math.min(MAX_TILE_RATIO, Math.max(MIN_TILE_RATIO, ratio));

/** Returns the tree with the split at `path` set to `ratio` (clamped). */
export const setTileRatio = (
  node: TileNode,
  path: string,
  ratio: number,
): TileNode => {
  if (node.kind === "group") return node;
  if (path === "") {
    const next = clampTileRatio(ratio);
    return node.ratio === next ? node : { ...node, ratio: next };
  }
  const rest = path.slice(1);
  return path.startsWith("0")
    ? { ...node, first: setTileRatio(node.first, rest, ratio) }
    : { ...node, second: setTileRatio(node.second, rest, ratio) };
};

/**
 * Clamps a dragged ratio so both sides keep their minimum size. When the
 * split is too small for both minimums, the ratio splits it by their weights.
 */
export const clampSplitRatio = (
  ratio: number,
  size: number,
  minFirst: number,
  minSecond: number,
) => {
  const low = Math.max(MIN_TILE_RATIO, size > 0 ? minFirst / size : 0);
  const high = Math.min(MAX_TILE_RATIO, size > 0 ? 1 - minSecond / size : 1);
  return low > high
    ? minFirst / (minFirst + minSecond)
    : Math.min(high, Math.max(low, ratio));
};
