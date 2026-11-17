import {
  type CsvGrid,
  type CsvSort,
  parseCsv,
  type SortKeys,
  sortOrder,
} from "./csv-grid";

export type CsvWorkerRequest =
  | { type: "parse"; text: string; delimiter: string; truncated: boolean }
  | ({ type: "sort"; id: number } & CsvSort);

export type CsvWorkerResponse =
  | { type: "parsed"; grid: CsvGrid }
  | { type: "sorted"; id: number; order: Uint32Array };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<CsvWorkerRequest>) => void) | null;
  postMessage: (message: CsvWorkerResponse, transfer: Transferable[]) => void;
};
const cache = new Map<number, SortKeys>();
let current: { text: string; grid: CsvGrid } | undefined;

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type === "parse") {
    const grid = parseCsv(request.text, request.delimiter, request.truncated);
    current = { text: request.text, grid };
    cache.clear();
    const copy: CsvGrid = {
      ...grid,
      rowStart: grid.rowStart.slice(),
      rowCell: grid.rowCell.slice(),
      cellEnd: grid.cellEnd.slice(),
    };
    scope.postMessage({ type: "parsed", grid: copy }, [
      copy.rowStart.buffer,
      copy.rowCell.buffer,
      copy.cellEnd.buffer,
    ]);
    return;
  }
  if (current === undefined) return;
  const order = sortOrder(
    current.text,
    current.grid,
    cache,
    request.column,
    request.direction,
  );
  scope.postMessage({ type: "sorted", id: request.id, order }, [order.buffer]);
};
