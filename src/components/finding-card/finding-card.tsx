import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import { CapyMark } from "@/components/capy-logo";
import {
  pullReactivityKeys,
  pullReviewAtom,
  updateFindingAtom,
} from "@/components/diff-tab/atoms";
import type { PullRef } from "@/components/diff-tab/model";
import { readyDiff, usePullDiff } from "@/components/diff-tab/use-pull-diff";
import { goneOr } from "@/components/pull-view/gone";
import { SuggestionBlock } from "@/components/suggestion-block";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type FindingMemory,
  type FindingRule,
  type FindingStatus,
  type FindingTelemetry,
  findingAnchor,
  findingLabel,
  findingPrompt,
  findingTone,
  lineLabel,
  type PullFinding,
} from "./finding";
import { relativeTime } from "./time";

const sourceTriggerClass =
  "focus-gutter max-w-72 cursor-pointer truncate rounded-sm text-muted-foreground-1 underline decoration-muted-foreground-3 underline-offset-2 outline-none transition-colors duration-hover hover:text-foreground hover:decoration-muted-foreground-1 focus-visible:outline-ring-inset data-[popup-open]:text-foreground";

const sourcePopupClass =
  "flex w-72 flex-col gap-2 rounded-(--radius-card) border-hairline border-border-1 bg-popover p-3 shadow-plate";

export const copyPrompt = (prompt: string) => {
  if (navigator.clipboard === undefined) {
    toast.error("Could not copy prompt");
    return;
  }
  navigator.clipboard.writeText(prompt).then(
    () => toast.success("Prompt copied"),
    () => toast.error("Could not copy prompt"),
  );
};

export type CardActionProps = {
  label: string;
  icon: IconId;
  disabled?: boolean;
  onClick?: () => void;
};

export function CardAction({
  label,
  icon,
  disabled = false,
  onClick,
}: CardActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            <Icon name={icon} size="sm" />
          </Button>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

type FindingShellProps = {
  at: string;
  outdated: boolean;
  resolved: boolean;
  chip?: ReactNode;
  suffix?: string;
  actions: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

function FindingShell({
  at,
  outdated,
  resolved,
  chip,
  suffix,
  actions,
  footer,
  className,
  children,
}: FindingShellProps) {
  return (
    <div
      data-slot="finding-card"
      className={cx(
        "group/card flex flex-col gap-2 rounded-(--radius-card) border-hairline border-border-1 bg-card p-3 font-sans shadow-plate",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex min-w-0 max-w-full items-center gap-2">
            <CapyMark className="size-4.5" />
            <span className="truncate text-sm font-medium text-foreground">
              Capy Review
            </span>
          </span>
          {suffix !== undefined && (
            <span className="max-w-full truncate text-xs text-muted-foreground-2">
              {suffix}
            </span>
          )}
          <span className="text-xs text-muted-foreground-3">
            {relativeTime(at)}
          </span>
          {(chip !== undefined || outdated || resolved) && (
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              {chip}
              {outdated && (
                <Badge size="xs" color="warning" className="shrink-0">
                  Outdated
                </Badge>
              )}
              {resolved && (
                <Badge size="xs" color="success" className="shrink-0">
                  Resolved
                </Badge>
              )}
            </div>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-hover group-hover/card:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
          {actions}
        </span>
      </div>
      {children}
      {footer}
    </div>
  );
}

function RuleSource({ rule }: { rule: FindingRule | null }) {
  const label = rule?.file
    ? `file: ${rule.file.path.split("/").at(-1)}`
    : rule?.body
      ? `rule: ${rule.body.split("\n")[0]}`
      : "rule";
  const body =
    rule?.body ||
    (rule?.file
      ? "No additional description"
      : "Context is no longer available");
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label="Review context details"
        render={<button type="button" className={sourceTriggerClass} />}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className={sourcePopupClass}>
        <span className="text-sm font-medium">
          {rule?.file ? "File context" : "Review rule"}
        </span>
        {rule?.file && (
          <p className="text-xs text-muted-foreground-2 [overflow-wrap:anywhere]">
            Source: {rule.file.repo}/{rule.file.path}
          </p>
        )}
        {rule?.file && !rule.file.covered && (
          <Badge size="xs" color="warning" className="self-start">
            Source no longer covered
          </Badge>
        )}
        <p className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground-1 [overflow-wrap:anywhere]">
          {body}
        </p>
      </PopoverContent>
    </Popover>
  );
}

function MemorySource({ memory }: { memory: FindingMemory }) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label="Project memory details"
        render={<button type="button" className={sourceTriggerClass} />}
      >
        memory: {memory.title}
      </PopoverTrigger>
      <PopoverContent className={sourcePopupClass}>
        <span className="text-xs text-muted-foreground-2">Project memory</span>
        <span className="text-sm font-medium [overflow-wrap:anywhere]">
          {memory.title}
        </span>
      </PopoverContent>
    </Popover>
  );
}

function TelemetrySource({ telemetry }: { telemetry: FindingTelemetry }) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label="Production telemetry details"
        render={<button type="button" className={sourceTriggerClass} />}
      >
        production telemetry
      </PopoverTrigger>
      <PopoverContent className={cx(sourcePopupClass, "w-80")}>
        <span className="text-xs text-muted-foreground-2">
          {telemetry.window === null
            ? "Production telemetry"
            : `Production telemetry · last ${telemetry.window}`}
        </span>
        <p className="text-sm [overflow-wrap:anywhere]">
          {telemetry.note ?? "No summary was recorded for this read"}
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function FindingSources({ finding }: { finding: PullFinding }) {
  const sources = [
    finding.rule === null ? null : (
      <RuleSource key="rule" rule={finding.rule} />
    ),
    finding.memory === null ? null : (
      <MemorySource key="memory" memory={finding.memory} />
    ),
    finding.telemetry === null ? null : (
      <TelemetrySource key="telemetry" telemetry={finding.telemetry} />
    ),
  ].filter((source) => source !== null);
  if (sources.length === 0) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground-2">
      <span>Sources:</span>
      {sources.flatMap((source) =>
        source === sources[0]
          ? [source]
          : [
              <span key={`separator-${source.key}`} aria-hidden="true">
                ·
              </span>,
              source,
            ],
      )}
    </p>
  );
}

export function useUpdateFinding(pull: PullRef, findingId: string) {
  const update = useAtomSet(updateFindingAtom, { mode: "promise" });
  const refreshReview = useAtomRefresh(pullReviewAtom(pull.orgId, pull.id));
  const [pending, setPending] = useState(false);
  const setStatus = (status: FindingStatus) => {
    setPending(true);
    update({
      params: { orgId: pull.orgId, pullId: pull.id, findingId },
      payload: { status },
      reactivityKeys: [pullReactivityKeys.comments(pull.id)],
    })
      .catch((error: unknown) => {
        if (goneOr(error, "This finding", refreshReview)) return;
        toast.error("Could not update the finding", {
          description: String(error),
        });
      })
      .finally(() => setPending(false));
  };
  return { pending, setStatus };
}

export type FindingCardProps = {
  pull: PullRef;
  finding: PullFinding;
  insideDiff?: boolean;
  className?: string;
  children?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function FindingCard({
  pull,
  finding,
  insideDiff = false,
  className,
  children,
  actions,
  footer,
}: FindingCardProps) {
  const diff = readyDiff(usePullDiff(pull));
  const { pending, setStatus } = useUpdateFinding(pull, finding.id);
  const anchor = findingAnchor(finding, pull.diffPair?.head);
  const closed = finding.status !== "open";
  const location = lineLabel(anchor);
  const where =
    location === null
      ? null
      : `${anchor.file?.split("/").at(-1)} · ${location}`;
  const chip =
    finding.status === "irrelevant" ? (
      <Badge size="xs" color="neutral">
        Dismissed
      </Badge>
    ) : finding.status === "open" && finding.humanResolvedBy !== null ? (
      <Badge
        size="xs"
        color="neutral"
        title={`Thread resolved on GitHub by ${finding.humanResolvedBy}`}
      >
        Resolved on GitHub
      </Badge>
    ) : undefined;

  return (
    <FindingShell
      at={finding.createdAt}
      outdated={anchor.outdated}
      resolved={finding.status === "resolved"}
      chip={chip}
      suffix={
        !insideDiff && !finding.githubDeliveryExpired && where !== null
          ? where
          : undefined
      }
      actions={
        <>
          {finding.kind !== "note" && (
            <CardAction
              label="Copy prompt for agent"
              icon="console-sparkle"
              onClick={() => copyPrompt(findingPrompt(finding, diff))}
            />
          )}
          <CardAction
            label={closed ? "Reopen" : "Resolve"}
            icon={closed ? "arrows-repeat-circle" : "circle-check"}
            disabled={pending}
            onClick={() => setStatus(closed ? "open" : "resolved")}
          />
          {actions}
        </>
      }
      footer={
        <>
          {finding.githubDeliveryExpired && (
            <span className="text-2xs text-muted-foreground-3 tabular-nums">
              {!insideDiff && where !== null ? `${where} · ` : ""}
              Not posted to GitHub
            </span>
          )}
          {footer}
        </>
      }
      className={cx(
        finding.kind === "issue" &&
          finding.confidence === "investigate" &&
          "bg-transparent shadow-none",
        className,
      )}
    >
      <div className="text-sm text-balance">
        <span className={cx("text-sm font-medium", findingTone(finding))}>
          {findingLabel(finding)}
        </span>{" "}
        <span className="inline text-sm font-medium">{finding.summary}</span>
      </div>
      {finding.detail !== null && (
        <p className="text-xs whitespace-pre-wrap text-muted-foreground-1">
          {finding.detail}
        </p>
      )}
      {finding.suggestion !== null && (
        <SuggestionBlock
          pull={pull}
          code={finding.suggestion}
          file={anchor.file}
          startLine={anchor.startLine}
          line={anchor.line}
          mode={insideDiff ? "static" : "live"}
        />
      )}
      {finding.statusReason !== null && (
        <p className="text-xs text-muted-foreground-2">
          {finding.statusReason}
        </p>
      )}
      <FindingSources finding={finding} />
      {children}
    </FindingShell>
  );
}

export type FindingRowProps = {
  pull: PullRef;
  finding: PullFinding;
  onOpen: (file: string, findingId: string) => void;
  copyable?: boolean;
};

export function FindingRow({
  pull,
  finding,
  onOpen,
  copyable = false,
}: FindingRowProps) {
  const diff = readyDiff(usePullDiff(pull));
  const anchor = findingAnchor(finding, pull.diffPair?.head);
  const href =
    anchor.outdated && finding.githubCommentId !== null
      ? `${pull.url}#discussion_r${finding.githubCommentId}`
      : undefined;
  const location = lineLabel(anchor);
  const className = cx(
    "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left outline-none select-none",
    "transition-colors duration-hover hover:bg-secondary disabled:cursor-default disabled:hover:bg-transparent",
    "focus-visible:outline-ring-inset",
    finding.status !== "open" && "opacity-60",
  );
  const content = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span
          className={cx("shrink-0 text-xs font-medium", findingTone(finding))}
        >
          {findingLabel(finding)}
        </span>
        <span className="min-w-0 truncate text-xs">{finding.summary}</span>
      </div>
      {anchor.file !== null && (
        <span className="truncate text-2xs text-muted-foreground-3 tabular-nums">
          {anchor.file.split("/").at(-1)}
          {location === null ? "" : ` · ${location}`}
          {anchor.outdated ? " · outdated" : ""}
          {finding.githubDeliveryExpired ? " · Not posted to GitHub" : ""}
        </span>
      )}
    </div>
  );
  return (
    <div
      data-slot="finding-row"
      className="group/finding flex min-w-0 items-center"
    >
      {href === undefined ? (
        <button
          type="button"
          disabled={anchor.file === null || anchor.outdated}
          onClick={() => {
            if (anchor.file !== null && !anchor.outdated)
              onOpen(anchor.file, finding.id);
          }}
          className={className}
        >
          {content}
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="View outdated discussion on GitHub"
          className={className}
        >
          {content}
        </a>
      )}
      {copyable && finding.kind !== "note" && (
        <span className="shrink-0 opacity-0 group-hover/finding:opacity-100 group-focus-within/finding:opacity-100 pointer-coarse:opacity-100">
          <CardAction
            label="Copy prompt for agent"
            icon="console-sparkle"
            onClick={() => copyPrompt(findingPrompt(finding, diff))}
          />
        </span>
      )}
    </div>
  );
}
