import { FileChip } from "@/components/markdown-chips";
import type { ActivityRow } from "@/data/events";
import { DiffBodyCard } from "@/features/thread/diff-body";
import { cleanOutput } from "./clean";
import { EXPANDABLE_PATCH_LINES, patchForTool, patchPath } from "./patch";

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

/**
 * The tools whose body is what they said, not what they printed. Capy keeps
 * this as a per-tool spec; the field is where the words live in the call.
 */
const PROSE_FIELD: Record<string, string> = {
  message_agent: "text",
  end_turn: "reason",
  environment_request_variables: "reason",
  request_desktop: "reason",
  pr_comment: "body",
  slack_post_to_channel: "text",
  review_rule_create: "body",
  review_rule_update: "body",
  memory_save: "body",
};

/** A terminal call shows its command head and outcome; the output lives in the pane. */
const TERMINAL_TOOLS: ReadonlySet<string> = new Set(["request_terminal"]);

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
    PROSE_FIELD[row.toolName] !== undefined ||
    TERMINAL_TOOLS.has(row.toolName) ||
    patchForTool(row.toolName, row.args) !== undefined ||
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

/** The prose body: the words the call carried, in Capy's muted reading tone. */
function ProseBody({ text }: { text: string | undefined }) {
  return (
    <div className="kiki-prose-body overflow-x-hidden overflow-y-auto md:scroll-fade-y">
      {text === undefined ? (
        <p className="text-sm text-muted-foreground-3">No text</p>
      ) : (
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground-2">
          {text}
        </p>
      )}
    </div>
  );
}

export function ToolBody({ row }: ToolBodyProps) {
  const proseField = PROSE_FIELD[row.toolName];
  if (proseField !== undefined)
    return (
      <ProseBody
        text={field(row.args, proseField) ?? field(row.call?.input, proseField)}
      />
    );
  const patch = patchForTool(row.toolName, row.args);
  if (patch !== undefined)
    return (
      <DiffBodyCard
        patch={patch}
        path={patchPath(patch)}
        expandable={patch.split("\n").length <= EXPANDABLE_PATCH_LINES}
      />
    );
  const command =
    field(row.args, "command") ?? field(row.call?.input, "command");
  const { text: output, trimmed } = cleanOutput(
    TERMINAL_TOOLS.has(row.toolName) ? "" : resultText(row),
  );
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
          {trimmed > 0 && (
            <p className="text-sm text-muted-foreground-3">
              {trimmed} earlier {trimmed === 1 ? "line" : "lines"} trimmed
            </p>
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
