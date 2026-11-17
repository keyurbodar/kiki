export type CsvGrid = {
  rows: number;
  columns: number;
  rowStart: Uint32Array;
  rowCell: Uint32Array;
  cellEnd: Uint32Array;
  numeric: boolean[];
  widths: number[];
  ragged: number;
};

export type SortDirection = "ascending" | "descending";

export type CsvSort = { column: number; direction: SortDirection };

export type SortKeys = Float64Array | { folded: boolean; values: string[] };

const QUOTE = 34;
const LINE_FEED = 10;
const CARRIAGE_RETURN = 13;
const SAMPLE_ROWS = 1000;
const NUMERIC = /^[-+]?(?:\d[\d,]*(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?%?$/;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const grow = (
  array: Uint32Array<ArrayBuffer>,
  index: number,
): Uint32Array<ArrayBuffer> => {
  if (index < array.length) return array;
  const next = new Uint32Array(array.length * 2);
  next.set(array);
  return next;
};

export function cellText(
  text: string,
  grid: CsvGrid,
  row: number,
  column: number,
): string {
  const first = grid.rowCell[row] ?? 0;
  if (column >= (grid.rowCell[row + 1] ?? 0) - first) return "";
  const end = grid.cellEnd[first + column] ?? 0;
  const start =
    column === 0
      ? (grid.rowStart[row] ?? 0)
      : (grid.cellEnd[first + column - 1] ?? 0) + 1;
  if (text.charCodeAt(start) !== QUOTE) return text.slice(start, end);
  const close = text.lastIndexOf('"', end - 1);
  return text
    .slice(start + 1, close > start ? close : end)
    .replaceAll('""', '"');
}

export function parseCsv(
  text: string,
  delimiter: string,
  truncated: boolean,
): CsvGrid {
  const separator = delimiter.charCodeAt(0);
  const length = text.length;
  let rowStart = new Uint32Array(1024);
  let rowCell = new Uint32Array(1024);
  let cellEnd = new Uint32Array(Math.max(1024, Math.ceil(length / 8)));
  let rows = 0;
  let cells = 0;
  let at = Number(text.charCodeAt(0) === 65279);
  if (at < length) {
    rowStart[0] = at;
    rowCell[0] = 0;
    rows = 1;
  }
  while (at < length) {
    let code = text.charCodeAt(at);
    if (code === QUOTE) {
      at += 1;
      while (at < length) {
        code = text.charCodeAt(at);
        at += 1;
        if (code === QUOTE) {
          if (text.charCodeAt(at) !== QUOTE) break;
          at += 1;
        }
      }
    }
    while (at < length) {
      code = text.charCodeAt(at);
      if (code === separator || code === LINE_FEED || code === CARRIAGE_RETURN)
        break;
      at += 1;
    }
    cellEnd = grow(cellEnd, cells);
    cellEnd[cells] = at;
    cells += 1;
    if (at >= length) break;
    at += 1;
    if (code === separator) {
      if (at < length) continue;
      cellEnd = grow(cellEnd, cells);
      cellEnd[cells] = at;
      cells += 1;
      break;
    }
    if (code === CARRIAGE_RETURN && text.charCodeAt(at) === LINE_FEED) at += 1;
    if (at >= length) break;
    rowStart = grow(rowStart, rows);
    rowCell = grow(rowCell, rows);
    rowStart[rows] = at;
    rowCell[rows] = cells;
    rows += 1;
  }
  const kept = truncated && rows > 1 ? rows - 1 : rows;
  rowCell = grow(rowCell, kept);
  rowCell[kept] = kept === rows ? cells : (rowCell[kept] ?? cells);
  const base: CsvGrid = {
    rows: kept,
    columns: 0,
    rowStart: rowStart.slice(0, kept),
    rowCell: rowCell.slice(0, kept + 1),
    cellEnd: cellEnd.slice(0, rowCell[kept]),
    numeric: [],
    widths: [],
    ragged: 0,
  };
  const counts = Array.from(
    { length: kept },
    (_, row) => (base.rowCell[row + 1] ?? 0) - (base.rowCell[row] ?? 0),
  );
  const header = counts[0] ?? 0;
  const columns = counts.reduce((max, count) => Math.max(max, count), 0);
  const sample = Array.from(
    { length: Math.min(SAMPLE_ROWS, Math.max(0, kept - 1)) },
    (_, index) => index + 1,
  );
  const numeric = Array.from({ length: columns }, (_, column) => {
    const values = sample
      .map((row) => cellText(text, base, row, column).trim())
      .filter((value) => value !== "");
    return (
      values.length > 0 &&
      values.filter((value) => NUMERIC.test(value)).length >=
        values.length * 0.9
    );
  });
  const widths = Array.from({ length: columns }, (_, column) =>
    Math.min(
      40,
      Math.max(
        4,
        cellText(text, base, 0, column).length + 3,
        ...sample.map((row) => cellText(text, base, row, column).length),
      ),
    ),
  );
  return {
    ...base,
    columns,
    numeric,
    widths,
    ragged: counts.slice(1).filter((count) => count !== header).length,
  };
}

export function sortKeys(
  text: string,
  grid: CsvGrid,
  column: number,
): SortKeys {
  const body = Math.max(0, grid.rows - 1);
  if (grid.numeric[column] === true) {
    return Float64Array.from({ length: body }, (_, row) => {
      const value = cellText(text, grid, row + 1, column).trim();
      return value === "" ? Number.NaN : Number(value.replace(/[,%]/g, ""));
    });
  }
  const values = Array.from({ length: body }, (_, row) =>
    cellText(text, grid, row + 1, column).trim(),
  );
  if (!values.every((value) => PRINTABLE_ASCII.test(value))) {
    return { folded: false, values };
  }
  const lowered = values.map((value) =>
    value
      .toLowerCase()
      .replace(/\d+/g, (digits) => digits.replace(/^0+(?=\d)/, "")),
  );
  const pad = lowered.reduce(
    (max, value) =>
      Math.max(
        max,
        ...(value.match(/\d+/g) ?? []).map((digits) => digits.length),
      ),
    0,
  );
  return {
    folded: true,
    values: lowered.map((value) =>
      value.replace(/\d+/g, (digits) => digits.padStart(pad, "0")),
    ),
  };
}

export function sortOrder(
  text: string,
  grid: CsvGrid,
  cache: Map<number, SortKeys>,
  column: number,
  direction: SortDirection,
): Uint32Array {
  const body = Math.max(0, grid.rows - 1);
  const sign = direction === "ascending" ? 1 : -1;
  const keys = cache.get(column) ?? sortKeys(text, grid, column);
  cache.set(column, keys);
  const filled: number[] = [];
  const blank: number[] = [];
  for (let row = 0; row < body; row += 1) {
    const value = keys instanceof Float64Array ? keys[row] : keys.values[row];
    (value === "" || (typeof value === "number" && Number.isNaN(value))
      ? blank
      : filled
    ).push(row);
  }
  const sorted = Uint32Array.from(filled);
  if (keys instanceof Float64Array) {
    sorted.sort((a, b) => ((keys[a] ?? 0) - (keys[b] ?? 0)) * sign || a - b);
  } else if (keys.folded) {
    sorted.sort((a, b) => {
      const left = keys.values[a] ?? "";
      const right = keys.values[b] ?? "";
      return left < right ? -sign : left > right ? sign : a - b;
    });
  } else {
    sorted.sort(
      (a, b) =>
        collator.compare(keys.values[a] ?? "", keys.values[b] ?? "") * sign ||
        a - b,
    );
  }
  const order = new Uint32Array(body);
  order.set(sorted);
  order.set(blank, sorted.length);
  return order;
}
