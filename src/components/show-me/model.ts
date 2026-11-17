export type ShowMeSign = "added" | "removed" | "same";

export interface ShowMeLine {
  readonly text: string;
  readonly depth: number;
  readonly sign: ShowMeSign;
  readonly note: string | null;
  readonly path: string | null;
  readonly line: number | null;
}

export type ShowMeListShape =
  | "call_tree"
  | "component_tree"
  | "pseudocode"
  | "file_tree"
  | "data_shape"
  | "output";

export interface ShowMeListView {
  readonly shape: ShowMeListShape;
  readonly title: string;
  readonly lines: ReadonlyArray<ShowMeLine>;
}

export interface FlowNode {
  readonly id: string;
  readonly text: string;
  readonly sign: ShowMeSign;
  readonly path: string | null;
  readonly line: number | null;
  readonly decision?: boolean;
}

export interface FlowEdge {
  readonly from: string;
  readonly to: string;
  readonly label: string | null;
}

export interface ShowMeFlowView {
  readonly shape: "flow";
  readonly title: string;
  readonly nodes: ReadonlyArray<FlowNode>;
  readonly edges: ReadonlyArray<FlowEdge>;
}

export type ShowMeView = ShowMeListView | ShowMeFlowView;

export interface ShowMeChapter {
  readonly id: string;
  readonly number: string;
}

export type LandSide = "additions" | "deletions";

export const shapeNames: Record<ShowMeView["shape"], string> = {
  call_tree: "call tree",
  component_tree: "component tree",
  pseudocode: "pseudocode",
  file_tree: "file tree",
  data_shape: "type",
  output: "output",
  flow: "flow",
};

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const entries = (
  view: ShowMeView,
): ReadonlyArray<{ readonly sign: ShowMeSign }> =>
  view.shape === "flow" ? view.nodes : view.lines;

export function signCounts(views: ReadonlyArray<ShowMeView>) {
  const all = views.flatMap(entries);
  return {
    added: all.filter((entry) => entry.sign === "added").length,
    removed: all.filter((entry) => entry.sign === "removed").length,
  };
}

/** Box-drawing prefix for a file tree row, as Capy draws it. */
export function treePrefix(lines: ReadonlyArray<ShowMeLine>, index: number) {
  const depth = lines[index]?.depth ?? 0;
  if (depth <= 0) return "";
  const continues = (level: number) => {
    const next = lines.slice(index + 1).find((line) => line.depth <= level);
    return next !== undefined && next.depth === level;
  };
  return (
    Array.from({ length: depth - 1 }, (_, level) =>
      continues(level + 1) ? "│   " : "    ",
    ).join("") + (continues(depth) ? "├── " : "└── ")
  );
}

/** Indexes of the depth-0 rows that head each type card in a data shape view. */
export const groupHeads = (lines: ReadonlyArray<ShowMeLine>) =>
  lines.flatMap((line, index) => (line.depth === 0 ? [index] : []));

export const splitField = (text: string) => {
  const match = text.match(/^(.*?):\s(.+)$/);
  return { name: match?.[1] ?? text, type: match?.[2] ?? null };
};

export const nodeCaption = (node: FlowNode) => {
  const file =
    node.path === null ? null : (node.path.split("/").at(-1) ?? null);
  if (node.decision) return "Decision";
  if (node.sign === "added") return `New${file === null ? "" : ` · ${file}`}`;
  if (node.sign === "removed")
    return `Removed${file === null ? "" : ` · ${file}`}`;
  return file;
};

export interface Box {
  readonly w: number;
  readonly h: number;
}

export interface FlowLayout {
  readonly width: number;
  readonly height: number;
  readonly boxes: ReadonlyMap<
    string,
    { x: number; y: number; w: number; h: number }
  >;
  readonly edges: ReadonlyArray<{
    readonly d: string;
    readonly head: string;
    readonly labelAt: readonly [number, number];
  } | null>;
}

/**
 * Layered left-to-right layout: each node sits in the column of its longest
 * path from a source, columns stack top to bottom, and edges route as
 * horizontal-vertical-horizontal elbows.
 */
export function layoutFlow(
  view: Pick<ShowMeFlowView, "nodes" | "edges">,
  sizes: ReadonlyMap<string, Box>,
  gap = { column: 48, row: 12 },
): FlowLayout {
  const rank = new Map(view.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < view.nodes.length; pass++) {
    let changed = false;
    for (const edge of view.edges) {
      const from = rank.get(edge.from);
      const to = rank.get(edge.to);
      if (from === undefined || to === undefined || edge.from === edge.to)
        continue;
      if (to < from + 1) {
        rank.set(edge.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns: Array<Array<string>> = [];
  for (const node of view.nodes) {
    const column = rank.get(node.id) ?? 0;
    const members = columns[column] ?? [];
    members.push(node.id);
    columns[column] = members;
  }
  const size = (id: string) => sizes.get(id) ?? { w: 0, h: 0 };
  const boxes = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >();
  let x = 0;
  let height = 0;
  for (const column of columns) {
    if (column === undefined) continue;
    let y = 0;
    const width = Math.max(0, ...column.map((id) => size(id).w));
    for (const id of column) {
      const { w, h } = size(id);
      boxes.set(id, { x, y, w, h });
      y += h + gap.row;
    }
    height = Math.max(height, y - gap.row);
    x += width + gap.column;
  }
  const edges = view.edges.map((edge) => {
    const a = boxes.get(edge.from);
    const b = boxes.get(edge.to);
    if (a === undefined || b === undefined || edge.from === edge.to)
      return null;
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const mid = x1 + (x2 - x1) / 2;
    return {
      d: `M${x1} ${y1}H${mid}V${y2}H${x2}`,
      head: `M${x2 - 6} ${y2 - 4}L${x2} ${y2}L${x2 - 6} ${y2 + 4}`,
      labelAt: [mid, (y1 + y2) / 2] as const,
    };
  });
  return {
    width: Math.max(0, x - gap.column),
    height: Math.max(0, height),
    boxes,
    edges,
  };
}
