import { read, utils } from "xlsx";
import { sheetToGrid, type WorkbookSheet } from "./sheet-grid";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ArrayBuffer>) => void) | null;
  postMessage: (
    message: { sheets: WorkbookSheet[] },
    transfer: Transferable[],
  ) => void;
};

scope.onmessage = (event) => {
  const workbook = read(event.data, {
    type: "array",
    dense: true,
    sheetStubs: true,
    sheetRows: 200_001,
  });
  const visibility = workbook.Workbook?.Sheets ?? [];
  const sheets = workbook.SheetNames.flatMap((name, index) => {
    const sheet = workbook.Sheets[name];
    return sheet === undefined || (visibility[index]?.Hidden ?? 0) !== 0
      ? []
      : [sheetToGrid(utils, name, sheet)];
  });
  scope.postMessage(
    { sheets },
    sheets.flatMap((sheet) => [
      sheet.grid.rowStart.buffer,
      sheet.grid.rowCell.buffer,
      sheet.grid.cellEnd.buffer,
      sheet.spans.buffer,
      sheet.pending.buffer,
    ]),
  );
};
