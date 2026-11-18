import type { ActivityRow } from "@/data/events";

type ToolRow = Extract<typeof ActivityRow.Type, { kind: "tool" }>;

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

/** Only a call that did not succeed carries a footer: its exit code. */
const footerOf = (row: ToolRow, exitCode: number | undefined) => {
  if (exitCode !== undefined && exitCode !== 0) return `exit ${exitCode}`;
  return row.result?.isError === true ? "failed" : undefined;
};

export function resultText(row: ToolRow) {
  return (row.result?.blocks ?? [])
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
    .trim();
}

export function hasToolBody(row: ToolRow) {
  return (
    field(row.args, "command") !== undefined ||
    field(row.call?.input, "command") !== undefined ||
    resultText(row) !== ""
  );
}

export type ToolBodyProps = { row: ToolRow };

export function ToolBody({ row }: ToolBodyProps) {
  const command =
    field(row.args, "command") ?? field(row.call?.input, "command");
  const output = resultText(row);
  const footer = footerOf(row, exitCodeOf(row.result?.data));
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
        </div>
        {footer !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-1.5 px-2.5 pt-0.5 pb-1.5 text-2xs tabular-nums">
            <span className="text-destructive">{footer}</span>
            <span className="flex gap-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
