import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { DiffStat, PullRequestStateIcon } from "@/components/diff-cards/cards";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  pullRequestLabel,
  type SummaryLivePullRequest,
  type SummaryPort,
  type SummaryPullRequestRef,
  type SummarySetupReference,
  type SummarySetupVersion,
  type SummaryTurn,
  summarizeTurn,
} from "./summarize";

const ROW =
  "flex min-h-9 w-full items-center gap-2 rounded-(--radius) px-3 text-sm tabular-nums";
const ROW_MARK = "flex size-4 shrink-0 items-center justify-center";
const ROW_INTERACTIVE =
  "cursor-pointer text-left transition-colors duration-hover hover:bg-secondary focus-visible:outline-ring-inset";

export type PullRequestRowProps = {
  reference: SummaryPullRequestRef;
  live?: SummaryLivePullRequest;
  onOpenPane?: (reference: SummaryPullRequestRef) => void;
};

export function PullRequestRow({
  reference,
  live,
  onOpenPane,
}: PullRequestRowProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenPane?.(reference)}
      className={`${ROW} ${ROW_INTERACTIVE}`}
    >
      <span className={ROW_MARK}>
        {live === undefined ? (
          <Icon
            name="pull-request"
            className="size-(--icon-xs) shrink-0 text-muted-foreground-2"
          />
        ) : (
          <PullRequestStateIcon state={live.state} />
        )}
      </span>
      <span className="shrink-0 text-muted-foreground-2 tabular-nums">
        {pullRequestLabel(reference, live)}
      </span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap font-medium text-foreground">
        {live?.title}
      </span>
      {live !== undefined && (
        <span className="shrink-0 text-xs tabular-nums">
          <DiffStat additions={live.additions} deletions={live.deletions} />
        </span>
      )}
    </button>
  );
}

export type PortRowProps = {
  port: SummaryPort;
  machineLabel: string;
  lifetime?: ReactNode;
  onOpen?: () => void;
  onOpenNewTab?: () => void;
};

export function PortRow({
  port,
  machineLabel,
  lifetime,
  onOpen,
  onOpenNewTab,
}: PortRowProps) {
  const content = (
    <>
      <span className={ROW_MARK}>
        <Icon
          name="globe"
          className="size-(--icon-xs) shrink-0 text-muted-foreground-2"
        />
      </span>
      <span className="shrink-0 text-muted-foreground-2">Port {port.port}</span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden font-medium whitespace-nowrap text-foreground">
        {port.title}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground-2">
        {machineLabel}
      </span>
    </>
  );
  if (onOpen === undefined || onOpenNewTab === undefined)
    return (
      <div data-slot="preview-card" className={ROW}>
        <span className="flex min-w-0 flex-1 items-center gap-2 self-stretch">
          {content}
        </span>
        {lifetime}
      </div>
    );
  return (
    <div
      data-slot="preview-card"
      className={`${ROW} transition-colors duration-hover hover:bg-secondary`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch rounded-(--radius) text-left focus-visible:outline-ring-inset"
        onClick={(event: MouseEvent) =>
          event.metaKey || event.ctrlKey ? onOpenNewTab() : onOpen()
        }
      >
        {content}
      </button>
      {lifetime}
    </div>
  );
}

export type SummaryBuild = {
  id: string;
  status: "building" | "succeeded" | "failed" | "cancelled";
  failureReason: string | null;
  startedAt?: Date;
  completedAt: Date | null;
};

const BUILD_STATUS_LABEL: Record<SummaryBuild["status"], string> = {
  building: "Building",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

const BUILD_STATUS_TONE: Record<SummaryBuild["status"], string> = {
  building: "text-info",
  succeeded: "text-success",
  failed: "text-destructive",
  cancelled: "text-muted-foreground-2",
};

export const buildFailureLabel = (reason: string) => {
  const match =
    /^(?:snapshot build step \S+ failed: )?Setup (\w+) failed for (\S+?):/.exec(
      reason,
    );
  const [, step = "", repo = ""] = match ?? [];
  return match === null
    ? "Build failed"
    : `${step.charAt(0).toUpperCase()}${step.slice(1)}, ${repo}`;
};

export const buildStatusLabel = (build: SummaryBuild | undefined) =>
  build === undefined
    ? "Starting"
    : build.status === "failed" && build.failureReason !== null
      ? buildFailureLabel(build.failureReason)
      : build.status === "building"
        ? "Running"
        : BUILD_STATUS_LABEL[build.status];

export const buildElapsedMs = (build: SummaryBuild, now: number) => {
  const started = build.startedAt?.getTime();
  if (started === undefined) return undefined;
  if (build.completedAt === null)
    return build.status === "building" ? now - started : undefined;
  return build.completedAt.getTime() - started;
};

export const formatElapsed = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds % 60}s`;
};

export type BuildRowProps = {
  reference: Extract<SummarySetupReference, { kind: "build" }>;
  build?: SummaryBuild;
  now?: number;
  onOpen?: () => void;
};

export function BuildRow({ reference, build, now, onOpen }: BuildRowProps) {
  const elapsed =
    build === undefined ? undefined : buildElapsedMs(build, now ?? Date.now());
  const content = (
    <>
      <span className={ROW_MARK}>
        <span
          className={`size-2 rounded-full bg-current ${BUILD_STATUS_TONE[build?.status ?? "building"]}`}
        />
      </span>
      <span className="shrink-0 text-muted-foreground-2">
        {reference.test ? "Test build" : "Snapshot build"}
      </span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden font-medium whitespace-nowrap text-foreground">
        {buildStatusLabel(build)}
      </span>
      {elapsed !== undefined && (
        <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      )}
    </>
  );
  if (onOpen === undefined) return <div className={ROW}>{content}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${ROW} ${ROW_INTERACTIVE}`}
    >
      {content}
    </button>
  );
}

export type SummaryCardProps = Omit<ComponentProps<"div">, "children"> & {
  turn: SummaryTurn & { ports: readonly SummaryPort[] };
  jamId?: string;
  pullRequests?: readonly SummaryLivePullRequest[];
  setupVersions?: readonly SummarySetupVersion[];
  setupBuilds?: readonly SummaryBuild[];
  machineLabel?: (port: SummaryPort) => string;
  onOpenPane?: (reference: SummaryPullRequestRef) => void;
  onOpenServicePreview?: (port: SummaryPort) => void;
  onOpenServicePreviewNewTab?: (port: SummaryPort) => void;
  onOpenSetup?: (reference: SummarySetupReference) => void;
};

export function SummaryCard({
  turn,
  jamId,
  pullRequests = [],
  setupVersions = [],
  setupBuilds = [],
  machineLabel,
  onOpenPane,
  onOpenServicePreview,
  onOpenServicePreviewNewTab,
  onOpenSetup,
  className,
  ...props
}: SummaryCardProps) {
  const rows = [
    ...turn.prs.map((reference) => (
      <PullRequestRow
        key={reference.url}
        reference={reference}
        live={pullRequests.find((pr) => pr.number === reference.number)}
        onOpenPane={onOpenPane}
      />
    )),
    ...turn.ports.map((port) => (
      <PortRow
        key={`${port.machineId}:${port.port}`}
        port={port}
        machineLabel={
          machineLabel?.(port) ??
          (port.owningJamId === undefined || port.owningJamId === jamId
            ? "Primary machine"
            : "Subagent machine")
        }
        onOpen={
          onOpenServicePreview === undefined
            ? undefined
            : () => onOpenServicePreview(port)
        }
        onOpenNewTab={
          onOpenServicePreviewNewTab === undefined
            ? undefined
            : () => onOpenServicePreviewNewTab(port)
        }
      />
    )),
    ...turn.setup.flatMap((reference) =>
      reference.kind === "build"
        ? [
            <BuildRow
              key={reference.toolCallId}
              reference={reference}
              build={setupBuilds.find((b) => b.id === reference.buildId)}
              onOpen={
                onOpenSetup === undefined
                  ? undefined
                  : () => onOpenSetup(reference)
              }
            />,
          ]
        : [],
    ),
  ];
  if (rows.length === 0) return null;
  return (
    <div
      className={["my-2 flex flex-col gap-2", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <Card className="px-1 py-1 pointer-coarse:overflow-visible">
        <div className="flex min-h-8 w-full items-center px-3 text-xs text-muted-foreground-1">
          <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
            {summarizeTurn(turn, pullRequests, setupVersions)}
          </span>
        </div>
        <div className="flex flex-col">{rows}</div>
      </Card>
    </div>
  );
}
