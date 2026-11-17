import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CsvTable, FileEmpty } from "@/components/csv-table";
import { fetchBlob } from "@/lib/fetch-blob";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { sheetNotices, spanMap, type WorkbookSheet } from "./sheet-grid";

export const SHEET_SIZE_LIMIT = 25_000_000;

export type SheetViewProps = {
  url: string;
  name: string;
  meta?: ReactNode;
  onViewport?: (element: HTMLDivElement | null) => void;
};

type Loaded =
  | { url: string; sheets: WorkbookSheet[] }
  | { url: string; oversize: Blob }
  | { url: string; failed: true };

export function SheetView({ url, name, meta, onViewport }: SheetViewProps) {
  const [loaded, setLoaded] = useState<Loaded>();
  const [forced, setForced] = useState<{ url: string; blob: Blob }>();
  const [selected, setSelected] = useState(0);
  const current = loaded?.url === url ? loaded : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const cleanups: (() => void)[] = [];
    (forced?.url === url
      ? Promise.resolve(forced.blob)
      : fetchBlob(url, controller.signal)
    )
      .then((blob) => {
        if (blob.size > SHEET_SIZE_LIMIT && forced?.url !== url) {
          if (!controller.signal.aborted) setLoaded({ url, oversize: blob });
          return;
        }
        return blob.arrayBuffer().then((buffer) => {
          if (controller.signal.aborted) return;
          const worker = new Worker(
            new URL("./sheet.worker.ts", import.meta.url),
            {
              type: "module",
            },
          );
          cleanups.push(() => worker.terminate());
          worker.onmessage = (
            event: MessageEvent<{ sheets: WorkbookSheet[] }>,
          ) => {
            worker.terminate();
            setSelected(0);
            setLoaded({ url, sheets: event.data.sheets });
          };
          worker.onerror = () => {
            worker.terminate();
            setLoaded({ url, failed: true });
          };
          worker.postMessage(buffer, [buffer]);
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ url, failed: true });
      });
    return () => {
      controller.abort();
      for (const cleanup of cleanups) cleanup();
    };
  }, [url, forced]);

  const sheets =
    current !== undefined && "sheets" in current ? current.sheets : undefined;
  const sheet = sheets?.[Math.min(selected, sheets.length - 1)];
  const tabs =
    sheets !== undefined && sheets.length > 1 ? (
      <div
        role="tablist"
        aria-label="Sheets"
        className="-ml-2 flex min-w-0 items-center gap-0.5 overflow-x-auto"
      >
        {sheets.map((entry, index) => (
          <Button
            key={entry.name}
            role="tab"
            aria-selected={entry === sheet}
            variant="ghost"
            size="xs"
            data-selected={entry === sheet ? "" : undefined}
            onClick={() => setSelected(index)}
          >
            {entry.name}
          </Button>
        ))}
      </div>
    ) : undefined;
  const table = useMemo(
    () =>
      sheet === undefined
        ? undefined
        : {
            grid: sheet.grid,
            spans: spanMap(sheet.spans),
            pending: new Set(sheet.pending),
            notices: sheetNotices(sheet),
            footer: tabs,
          },
    [sheet, tabs],
  );

  if (current !== undefined && "failed" in current) {
    return <FileEmpty line="Could not read this workbook" sub={meta} />;
  }
  if (current !== undefined && "oversize" in current) {
    const blob = current.oversize;
    return (
      <FileEmpty
        line={`${(blob.size / 1e6).toFixed(1)} MB workbook`}
        action={
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setLoaded(undefined);
              setForced({ url, blob });
            }}
          >
            Load anyway
          </Button>
        }
      />
    );
  }
  if (sheets === undefined) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-card">
        <DotGridIcon
          size="sm"
          role="status"
          aria-hidden={false}
          aria-label="Reading workbook"
        />
      </div>
    );
  }
  if (sheet === undefined || table === undefined) {
    return <FileEmpty line="No sheets in this workbook" sub={meta} />;
  }
  if (sheet.grid.columns === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-card">
        <FileEmpty line="Empty sheet" sub={sheet.name} />
        {tabs !== undefined && (
          <div className="flex h-7 shrink-0 items-center border-t-hairline border-border-1 px-3">
            {tabs}
          </div>
        )}
      </div>
    );
  }
  return (
    <CsvTable
      key={`${url}\u0000${sheet.name}`}
      text={sheet.text}
      name={name}
      truncated={false}
      onViewport={onViewport}
      sheet={table}
    />
  );
}
