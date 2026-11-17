import type { CellObject, Range, WorkSheet } from "xlsx";
import type { CsvGrid } from "@/components/csv-table";

export type WorkbookSheet = {
  name: string;
  text: string;
  grid: CsvGrid;
  spans: Uint32Array;
  pending: Uint32Array;
  limited: boolean;
};

export const MAX_SHEET_ROWS = 200_000;
export const MAX_SHEET_CELLS = 4_000_000;
const SAMPLE_ROWS = 1000;

type Utils = {
  decode_range: (range: string) => Range;
  encode_col: (column: number) => string;
};

const quote = (value: string) =>
  value.startsWith('"') ? `"${value.replaceAll('"', '""')}"` : value;

export function sheetToGrid(
  utils: Utils,
  name: string,
  sheet: WorkSheet,
): WorkbookSheet {
  const range = utils.decode_range(sheet["!ref"] ?? "A1:A1");
  const data = (sheet["!data"] ?? []) as (CellObject[] | undefined)[];
  const available =
    sheet["!ref"] === undefined ? 0 : Math.min(range.e.r + 1, data.length);
  let rows = 0;
  let columns = 0;
  while (rows < Math.min(available, MAX_SHEET_ROWS)) {
    const width = Math.max(
      columns,
      Math.min(range.e.c + 1, data[rows]?.length ?? 0),
    );
    if ((rows + 1) * width > MAX_SHEET_CELLS) break;
    columns = width;
    rows += 1;
  }
  const limited = rows < available;
  const merges = (sheet["!merges"] ?? []).filter(
    (merge) => merge.e.c > merge.s.c,
  );
  const mergeStarts = new Set(
    merges.map((merge) => merge.s.r * columns + merge.s.c),
  );
  const parts: string[] = [];
  const rowStart = new Uint32Array(rows + 1);
  const rowCell = Uint32Array.from(
    { length: rows + 2 },
    (_, row) => row * columns,
  );
  const cellEnd = new Uint32Array((rows + 1) * columns);
  const chars = Array.from(
    { length: columns },
    (_, column) => utils.encode_col(column).length + 3,
  );
  const stats = Array.from({ length: columns }, () => ({
    numbers: 0,
    filled: 0,
  }));
  const pending: number[] = [];
  let length = 0;
  const push = (cell: number, value: string) => {
    const quoted = quote(value);
    parts.push(quoted, "\t");
    length += quoted.length;
    cellEnd[cell] = length;
    length += 1;
  };
  for (let column = 0; column < columns; column += 1)
    push(column, utils.encode_col(column));
  for (let row = 0; row < rows; row += 1) {
    rowStart[row + 1] = length;
    const cells = data[row];
    for (let column = 0; column < columns; column += 1) {
      const cell = cells?.[column];
      const formula = cell?.t === "z" && cell.f !== undefined;
      const value =
        cell === undefined || (cell.t === "z" && !formula)
          ? ""
          : formula
            ? `=${cell.f}`
            : (cell.w ?? String(cell.v ?? ""));
      if (formula) pending.push(row * columns + column);
      push((row + 1) * columns + column, value);
      if (row >= SAMPLE_ROWS || value === "") continue;
      const stat = stats[column];
      if (stat === undefined) continue;
      stat.filled += 1;
      if (cell?.t === "n" || cell?.t === "d") stat.numbers += 1;
      if (!mergeStarts.has(row * columns + column)) {
        chars[column] = Math.max(chars[column] ?? 0, value.length);
      }
    }
  }
  const declared = sheet["!cols"] ?? [];
  const widths = chars.map((width, column) => {
    const set = declared[column]?.wch ?? declared[column]?.width;
    return Math.min(40, Math.max(4, Math.round(set ?? width)));
  });
  return {
    name,
    text: parts.join(""),
    grid: {
      rows: rows + 1,
      columns,
      rowStart,
      rowCell,
      cellEnd,
      numeric: stats.map((stat) => stat.numbers * 2 > stat.filled),
      widths,
      ragged: 0,
    },
    spans: new Uint32Array(
      merges.flatMap((merge) => [
        merge.s.r,
        merge.s.c,
        merge.e.c - merge.s.c + 1,
      ]),
    ),
    pending: Uint32Array.from(pending),
    limited,
  };
}

export const spanMap = (spans: Uint32Array) => {
  const map = new Map<number, Map<number, number>>();
  for (let index = 0; index + 2 < spans.length; index += 3) {
    const row = spans[index] ?? 0;
    const columns = map.get(row) ?? new Map<number, number>();
    columns.set(spans[index + 1] ?? 0, spans[index + 2] ?? 1);
    map.set(row, columns);
  }
  return map;
};

export const sheetNotices = (sheet: WorkbookSheet) => {
  const pending = sheet.pending.length;
  return [
    sheet.limited
      ? `Showing the first ${(sheet.grid.rows - 1).toLocaleString()} rows of this sheet`
      : undefined,
    pending === 0
      ? undefined
      : `${pending.toLocaleString()} ${pending === 1 ? "formula was" : "formulas were"} saved without a result, so ${pending === 1 ? "it shows" : "they show"} as written until the file is recalculated`,
  ].filter((notice): notice is string => notice !== undefined);
};
