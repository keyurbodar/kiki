import { cx } from "class-variance-authority";
import type { Schema } from "effect";
import type { ReactNode } from "react";
import type { UpdateRow as UpdateRowSchema } from "@/data/events";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon, type IconId } from "@/primitives/icon";

type UpdateRowData = Schema.Schema.Type<typeof UpdateRowSchema>;
type NoticeRow = Extract<UpdateRowData, { kind: "notice" }>;
type OperationRow = Extract<UpdateRowData, { kind: "operation" }>;

const objectField = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const stringField = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;
const numberField = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

export type UpdateRowProps = {
  row: UpdateRowData;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onOpenThread?: (jamId: string) => void;
  onOpenPr?: (url: string) => void;
  className?: string;
};

const statusIcon: Record<string, IconId> = {
  success: "circle-check",
  failure: "circle-x",
  attention: "exclamation-triangle",
  neutral: "circle-dotted",
};

const sourceIcon: Record<string, IconId> = {
  github: "github",
  slack: "chat-bubbles",
  linear: "circle-dotted",
  task: "user",
  review: "review",
  operation: "console-sparkle",
  webhook: "webhooks",
  issue: "circle-dashed",
  capy: "sparkle",
};

/** The source kind Capy uses to pick an update's icon. */
export function updateSource(row: UpdateRowData): string {
  if (row.kind === "task") return "task";
  if (row.kind === "operation") return "operation";
  if (row.kind === "review") return "review";
  const key = row.notificationKey;
  if (key === "task_blocked") return "task";
  if (key === "review_completed" || key === "review_failed") return "review";
  if (key === "thread_merge_settle") return "github";
  if (key.startsWith("slack")) return "slack";
  if (key.startsWith("linear")) return "linear";
  if (
    key.startsWith("ci_") ||
    key.startsWith("pr_") ||
    key.startsWith("github_")
  )
    return "github";
  return "capy";
}

/** The status colour of an update, as a Capy intent. */
export function updateStatus(row: UpdateRowData): string {
  if (row.kind === "notice") {
    const notice: NoticeRow = row;
    const ci = objectField(notice.ciResult) ? notice.ciResult : undefined;
    const pr = objectField(notice.prTransition)
      ? notice.prTransition
      : undefined;
    if (pr !== undefined)
      return stringField(pr.transition) === "merged" ? "success" : "failure";
    if (notice.prConflict !== undefined || notice.ciUnsettled !== undefined)
      return "attention";
    if (notice.reviewFailed !== undefined) return "failure";
    if (ci !== undefined)
      return stringField(ci.outcome) === "passed" ? "success" : "failure";
  }
  if (row.kind === "task") {
    if (row.outcome === "completed") return "success";
    if (row.outcome === "failed") return "failure";
    return "neutral";
  }
  if (row.kind === "operation") return row.isError ? "failure" : "success";
  if (row.kind === "review") {
    if (row.issues === undefined) return "neutral";
    return row.issues === 0 ? "success" : "attention";
  }
  return "neutral";
}

export function updateLabel(row: UpdateRowData): string {
  if (row.kind === "review") {
    const pr = row.prNumber === undefined ? "" : ` on PR #${row.prNumber}`;
    if (row.issues === undefined) return `Review finished${pr}`;
    if (row.issues === 0) return `Review clean${pr}`;
    return `Review left ${row.issues} ${row.issues === 1 ? "issue" : "issues"}${pr}`;
  }
  if (row.kind === "operation") return operationLabel(row);
  if (row.kind === "task") {
    const name =
      row.reference.kind === "task"
        ? `Subagent ${row.reference.localIndex}`
        : row.reference.code;
    const outcome =
      row.outcome === "completed" &&
      row.reference.kind === "thread" &&
      row.needs === "person"
        ? "needs you"
        : row.outcome === "completed"
          ? "finished"
          : row.outcome;
    return `${name} ${outcome}`;
  }
  if (row.prFeedback !== undefined) {
    const state = row.prFeedback.state;
    const verb =
      row.prFeedback.kind === "review"
        ? state === "approved"
          ? "approved"
          : state === "changes_requested"
            ? "requested changes on"
            : "reviewed"
        : "commented on";
    return `${row.prFeedback.author} ${verb} PR #${row.prFeedback.prNumber}`;
  }
  return row.summary;
}

function operationLabel(row: OperationRow): string {
  const ended = objectField(row.watchEnded) ? row.watchEnded : undefined;
  if (ended !== undefined) {
    const number = numberField(ended.prNumber);
    const pr = number === undefined ? "the pull request" : `PR #${number}`;
    const reason = stringField(ended.reason);
    if (reason === "merged" || reason === "closed")
      return `Stopped watching ${pr}, ${reason}`;
    if (reason === "moved")
      return `Stopped watching ${pr}, another thread owns it`;
    return `Stopped watching ${pr}`;
  }
  if (row.watch !== undefined) return "Watching the background command";
  const state = row.isError ? "failed" : "finished";
  return row.commandLabel === undefined
    ? `Background command ${state}`
    : `${row.commandLabel}, ${state} in the background`;
}

function UpdateIcon({ row }: { row: UpdateRowData }) {
  const status = updateStatus(row);
  const source = sourceIcon[updateSource(row)] ?? "sparkle";
  return (
    <span
      className={cx(
        "flex size-4 shrink-0 items-center justify-center",
        status === "success" && "text-success",
        status === "failure" && "text-destructive",
        status === "attention" && "text-warning-fg",
        status === "neutral" && "text-muted-foreground-2",
      )}
    >
      <Icon name={statusIcon[status] ?? source} className="size-3.5" />
    </span>
  );
}

function detailBody(row: UpdateRowData): ReactNode | undefined {
  if (row.kind === "notice") {
    const issue = objectField(row.issueActivity)
      ? row.issueActivity.body
      : undefined;
    const feedback = row.prFeedback?.body;
    const slack = objectField(row.slackMessage)
      ? row.slackMessage.text
      : undefined;
    const body = stringField(issue) ?? feedback ?? stringField(slack);
    if (body !== undefined && body.trim() !== "") return body;
  }
  if (row.kind === "operation") {
    const text = row.blocks.find((block) => block.type === "text");
    if (text?.type === "text") return text.text;
  }
  return undefined;
}

/** One source-marked update line, expanding to a detail body when there is one. */
export function UpdateRow({
  row,
  expanded = false,
  onToggleExpanded,
  onOpenThread,
  onOpenPr,
  className,
}: UpdateRowProps) {
  const body = detailBody(row);
  const prTransition =
    row.kind === "notice" && objectField(row.prTransition)
      ? row.prTransition
      : undefined;
  const prNumber =
    prTransition === undefined ? undefined : numberField(prTransition.prNumber);
  const prRepo =
    prTransition === undefined
      ? undefined
      : stringField(prTransition.repoFullName);
  const prUrl =
    prNumber !== undefined && prRepo !== undefined
      ? `https://github.com/${prRepo}/pull/${prNumber}`
      : undefined;
  const label = updateLabel(row);
  const content = (
    <span className="flex min-w-0 items-baseline gap-1 text-xs text-muted-foreground-2">
      <UpdateIcon row={row} />
      <span className="min-w-0 truncate">
        {row.kind === "task" && row.reference.kind === "thread" ? (
          <Button
            variant="link"
            size="auto-xs"
            onClick={() => onOpenThread?.(row.childJamId)}
            className="p-0 text-xs whitespace-nowrap"
          >
            {row.reference.code}
          </Button>
        ) : (
          label.slice(
            0,
            row.kind === "task" && row.reference.kind === "thread"
              ? row.reference.code.length
              : undefined,
          )
        )}
        {row.kind === "task" && row.reference.kind === "thread"
          ? label.slice(row.reference.code.length)
          : null}
      </span>
      {prUrl === undefined ? null : (
        <Button
          variant="link"
          size="auto-xs"
          onClick={() => onOpenPr?.(prUrl)}
          className="p-0 text-xs whitespace-nowrap"
        >
          {`PR #${prNumber}`}
        </Button>
      )}
    </span>
  );
  const root = (
    <div
      className={cx("flex min-h-7 w-full items-center gap-1.5 py-1", className)}
    >
      {content}
    </div>
  );
  if (body === undefined || onToggleExpanded === undefined) return root;
  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger className="w-full text-left">
        {content}
      </CollapsibleTrigger>
      <CollapsiblePanel className="min-w-0 overflow-clip">
        <div className="flex flex-col gap-2 py-1 text-xs whitespace-pre-wrap text-muted-foreground">
          {body}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
