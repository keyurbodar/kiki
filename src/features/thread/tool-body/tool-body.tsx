import type { ActivityRow } from "@/data/events";
import { elapsedEnter, formatDuration } from "@/features/thread/live-status";

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
  const exitCode = exitCodeOf(row.result?.data);
  const settledMs =
    row.result !== undefined && row.startedAt !== undefined
      ? row.result.settledAt.getTime() - row.startedAt.getTime()
      : undefined;
  const footer =
    exitCode !== undefined
      ? `exit ${exitCode}`
      : row.result?.isError
        ? "failed"
        : undefined;
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
        {(footer !== undefined || settledMs !== undefined) && (
          <div className="flex shrink-0 items-center justify-between gap-1.5 px-2.5 pt-0.5 pb-1.5 text-2xs tabular-nums">
            <span className="text-muted-foreground-3">{footer}</span>
            <span className="flex gap-1.5">
              {settledMs !== undefined && (
                <span
                  className={`shrink-0 text-muted-foreground-2 tabular-nums ${elapsedEnter}`}
                >
                  {formatDuration(settledMs, "latency")}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
