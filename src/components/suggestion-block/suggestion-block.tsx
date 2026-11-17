import { cx } from "class-variance-authority";
import type { PullRef } from "@/components/diff-tab/model";
import { readyDiff, usePullDiff } from "@/components/diff-tab/use-pull-diff";
import {
  anchorRows,
  type HunkRow,
  originalLines,
  parseHunkRows,
  suggestionRows,
} from "./patch";

const headerClass =
  "flex min-h-6 items-center gap-2 border-b-hairline border-border-1 bg-secondary px-2 py-1";

const anchorHeaderClass =
  "flex min-h-6 items-center gap-2 border-b-hairline border-border-1 bg-card px-2 py-1";

export type SuggestionRowsProps = { rows: ReadonlyArray<HunkRow> };

export function SuggestionRows({ rows }: SuggestionRowsProps) {
  return (
    <div className="overflow-x-auto bg-card">
      <table className="w-full border-separate border-spacing-0 font-mono text-code-block leading-normal">
        <tbody>
          {rows.map((row, index) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and never reorder
              key={index}
              className={cx(
                row.marker === "+" && "bg-(--diff-add-wash)",
                row.marker === "-" && "bg-(--diff-del-wash)",
              )}
            >
              <td className="w-10 px-2 text-right align-top whitespace-nowrap text-muted-foreground-3 tabular-nums select-none">
                {row.marker === "-" ? row.oldNo : row.newNo}
              </td>
              <td
                className={cx(
                  "w-5 text-center align-top select-none",
                  row.marker === "+" && "text-diff-add",
                  row.marker === "-" && "text-diff-del",
                )}
              >
                {row.marker === " " ? "" : row.marker === "-" ? "\u2212" : "+"}
              </td>
              <td className="w-full px-2 whitespace-pre text-foreground">
                {row.text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type SuggestionBlockProps = {
  pull?: PullRef;
  code: string;
  file: string | null;
  startLine: number | null;
  line: number | null;
  mode?: "live" | "static";
  className?: string;
};

export function SuggestionBlock({
  pull,
  code,
  file,
  startLine,
  line,
  mode = "live",
  className,
}: SuggestionBlockProps) {
  if (
    pull === undefined ||
    pull.diffPair === null ||
    file === null ||
    line === null
  )
    return (
      <SuggestionView
        code={code}
        original={null}
        file={file}
        startLine={startLine}
        line={line}
        mode={mode}
        className={className}
      />
    );
  return (
    <HydratedSuggestion
      pull={pull}
      code={code}
      file={file}
      startLine={startLine}
      line={line}
      mode={mode}
      className={className}
    />
  );
}

function HydratedSuggestion({
  pull,
  code,
  file,
  startLine,
  line,
  mode,
  className,
}: Omit<SuggestionBlockProps, "pull" | "file" | "line"> & {
  pull: PullRef;
  file: string;
  line: number;
}) {
  const patch =
    readyDiff(usePullDiff(pull))?.files.find((entry) => entry.path === file)
      ?.patch ?? null;
  const original =
    patch === null
      ? null
      : originalLines(parseHunkRows(patch), startLine ?? line, line);
  return (
    <SuggestionView
      code={code}
      original={original}
      file={file}
      startLine={startLine}
      line={line}
      mode={mode}
      className={className}
    />
  );
}

function SuggestionView({
  code,
  original,
  file,
  startLine,
  line,
  className,
}: Omit<SuggestionBlockProps, "pull"> & {
  original: ReadonlyArray<string> | null;
}) {
  const rows = suggestionRows(code, original, startLine ?? line ?? 1);
  if (rows.length === 0) return null;
  return (
    <div
      data-slot="suggestion-block"
      className={cx(
        "overflow-hidden rounded border-hairline border-border-1",
        className,
      )}
    >
      <div className={headerClass}>
        <span className="shrink-0 text-2xs font-medium text-muted-foreground-2">
          Suggested fix
        </span>
        {file !== null && line !== null && (
          <span className="ml-auto min-w-0 truncate text-2xs text-muted-foreground-3 tabular-nums">
            {file.split("/").at(-1)} · L
            {startLine !== null && startLine !== line ? `${startLine}-` : ""}
            {line}
          </span>
        )}
      </div>
      <SuggestionRows rows={rows} />
    </div>
  );
}

export type AnchorHunkProps = {
  pull: PullRef;
  file: string;
  line: number;
  onOpen?: (file: string) => void;
};

export function AnchorHunk({ pull, file, line, onOpen }: AnchorHunkProps) {
  if (pull.diffPair === null) return null;
  return (
    <HydratedAnchorHunk pull={pull} file={file} line={line} onOpen={onOpen} />
  );
}

function HydratedAnchorHunk({ pull, file, line, onOpen }: AnchorHunkProps) {
  const patch =
    readyDiff(usePullDiff(pull))?.files.find((entry) => entry.path === file)
      ?.patch ?? null;
  const rows = patch === null ? [] : anchorRows(parseHunkRows(patch), line);
  if (rows.length === 0 && onOpen === undefined) return null;
  const label = (
    <span className="min-w-0 truncate text-2xs text-muted-foreground-1 transition-colors duration-hover group-hover/anchor:text-foreground">
      {file}
    </span>
  );
  return (
    <div className="flex flex-col">
      {onOpen === undefined ? (
        <span className={anchorHeaderClass}>{label}</span>
      ) : (
        <button
          type="button"
          onClick={() => onOpen(file)}
          className={cx(
            anchorHeaderClass,
            "group/anchor w-full cursor-pointer text-left outline-none select-none",
            "focus-visible:outline-ring-inset",
          )}
        >
          {label}
        </button>
      )}
      {rows.length > 0 && <SuggestionRows rows={rows} />}
    </div>
  );
}
