import { FileChip } from "@/components/markdown-chips";
import type { ActivityRow } from "@/data/events";

type ToolRow = Extract<typeof ActivityRow.Type, { kind: "tool" }>;
type Block = NonNullable<ToolRow["result"]>["blocks"][number];
type FileBlock = Extract<Block, { file: { name: string } }>;

const field = (value: unknown, key: string) => {
  if (typeof value !== "object" || value === null) return undefined;
  const found = (value as Record<string, unknown>)[key];
  return typeof found === "string" ? found : undefined;
};

const exitCodeOf = (data: unknown) => {
  if (typeof data !== "object" || data === null) return undefined;
  const code = (data as Record<string, unknown>).exit_code;
  return typeof code === "number" ? code : undefined;
};

const timedOut = (data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  (data as Record<string, unknown>).timed_out === true;

/** A JSON block renders as the indented document Capy prints, beside the text. */
const blockText = (block: Block) => {
  if (block.type === "text") return block.text;
  if (block.type === "json") return JSON.stringify(block.data, null, 2) ?? "";
  return undefined;
};

export function resultText(row: ToolRow) {
  return (row.result?.blocks ?? [])
    .flatMap((block) => {
      const text = blockText(block);
      return text === undefined ? [] : [text];
    })
    .join("\n")
    .trim();
}

/** Image, document, clip and file results render as chips under the output. */
const resultFiles = (row: ToolRow) =>
  (row.result?.blocks ?? []).flatMap((block): FileBlock[] =>
    block.type === "image" ||
    block.type === "document" ||
    block.type === "clip" ||
    block.type === "file"
      ? [block]
      : [],
  );

/** A block this client cannot paint; Capy asks for a newer build rather than drop it. */
const hasUnknownBlocks = (row: ToolRow) =>
  (row.result?.blocks ?? []).some((block) => block.type === "unsupported");

export function hasToolBody(row: ToolRow) {
  return (
    field(row.args, "command") !== undefined ||
    field(row.call?.input, "command") !== undefined ||
    resultText(row) !== "" ||
    resultFiles(row).length > 0 ||
    hasUnknownBlocks(row)
  );
}

type Status = { label: string; tone: "muted" | "error" };

/** Capy's trailing state: running, timed out, an exit code, or failed. */
const statusOf = (row: ToolRow): Status | undefined => {
  if (row.result === undefined) {
    return row.phase === "running" || row.phase === "forming"
      ? { label: "running", tone: "muted" }
      : undefined;
  }
  if (timedOut(row.result.data)) return { label: "timed out", tone: "error" };
  const exitCode = exitCodeOf(row.result.data);
  if (exitCode !== undefined)
    return {
      label: `exit ${exitCode}`,
      tone: exitCode === 0 ? "muted" : "error",
    };
  if (row.result.isError) return { label: "failed", tone: "error" };
  return undefined;
};

export type ToolBodyProps = { row: ToolRow };

export function ToolBody({ row }: ToolBodyProps) {
  const command =
    field(row.args, "command") ?? field(row.call?.input, "command");
  const output = resultText(row);
  const files = resultFiles(row);
  const unknown = hasUnknownBlocks(row);
  const status = statusOf(row);
  const empty = command === undefined && output === "" && files.length === 0;
  return (
    <div className="pt-1 pb-2">
      <div className="flex flex-col overflow-clip rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1 bg-card">
        <div className="md:scroll-fade-y flex max-h-72 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-2.5 py-1.5 font-mono text-code-block leading-normal">
          {command !== undefined && (
            <div className="flex gap-1.5">
              <span aria-hidden className="shrink-0 text-muted-foreground-3">
                $
              </span>
              <span
                data-component="shell-command"
                className="min-w-0 break-words whitespace-pre-wrap text-foreground"
              >
                {command}
              </span>
            </div>
          )}
          {output !== "" && (
            <pre className="min-w-0 break-words whitespace-pre-wrap text-muted-foreground-1">
              {output}
            </pre>
          )}
          {empty && (
            <p className="text-sm text-muted-foreground-3">No output</p>
          )}
          {files.length > 0 && (
            <div data-slot="tool-files" className="kiki-chip-row">
              {files.map((block) => (
                <FileChip key={block.file.fileId} value={block.file.name} />
              ))}
            </div>
          )}
          {unknown && (
            <p className="text-sm text-muted-foreground-3">
              This update needs a newer version of Capy
            </p>
          )}
        </div>
        {status !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-1.5 px-2.5 pt-0.5 pb-1.5 text-2xs tabular-nums">
            <span
              className={
                status.tone === "error"
                  ? "text-destructive"
                  : "text-muted-foreground-3"
              }
            >
              {status.label}
            </span>
            <span className="flex gap-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
