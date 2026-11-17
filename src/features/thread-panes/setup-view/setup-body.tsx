import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button, ButtonIcon } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { ChevronRightSmallGlyph } from "./glyphs";
import {
  buildDurationMs,
  buildLabel,
  buildStatusBuckets,
  buildsOpenByDefault,
  buildTitle,
  canRerunSetup,
  changeTarget,
  countCommands,
  countScripts,
  countStartup,
  describeChange,
  entryLists,
  formatAgo,
  formatDuration,
  hasHiddenBuilds,
  type LoadedSetup,
  machineSectionCount,
  machineSizeLabel,
  type ScriptTarget,
  type SetupPhase,
  type SetupRepository,
  type SetupStatus,
  type SnapshotBuild,
  scriptPhases,
  stepBuckets,
  stepKey,
  stepMeta,
  stepTitle,
  type ThreadChange,
  type ThreadMachine,
  visibleBuilds,
} from "./logic";
import { PaneSection } from "./pane-section";
import { dotsIcon, StatusBucketIcon } from "./status-icon";

export const rowHover =
  "cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";

const showAllClass =
  "flex min-h-7 cursor-pointer items-center rounded-(--radius) px-2 text-2xs text-muted-foreground-2 hover:text-foreground focus-visible:outline-ring-inset";

const fadeText = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

const emptyCopy = "px-4 py-3 text-xs text-muted-foreground-2";

export function BuildRow({
  build,
  now,
  onOpen,
}: {
  build: SnapshotBuild;
  now: number;
  onOpen: () => void;
}) {
  const duration = buildDurationMs(build, now);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-build-status={build.status}
      className={cx(
        "flex h-8 w-full min-w-0 items-center gap-2 rounded-(--radius) px-2 text-left text-sm",
        rowHover,
      )}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <StatusBucketIcon bucket={buildStatusBuckets[build.status]} />
      </span>
      <span className="shrink-0 text-muted-foreground-2">
        {buildTitle(build)}
      </span>
      <span className={cx(fadeText, "font-medium text-foreground")}>
        {buildLabel(build)}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2 text-2xs text-muted-foreground-2 tabular-nums">
        {duration !== undefined && <span>{formatDuration(duration)}</span>}
        <span suppressHydrationWarning>{formatAgo(build.createdAt, now)}</span>
      </span>
    </button>
  );
}

export function BuildsSection({
  builds,
  now,
  onOpenBuild,
}: {
  builds: SnapshotBuild[] | undefined;
  now: number;
  onOpenBuild: (build: SnapshotBuild) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  return (
    <PaneSection
      label="Builds"
      count={builds === undefined ? "" : String(builds.length)}
      defaultOpen={buildsOpenByDefault(builds)}
    >
      {builds === undefined ? (
        <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground-2">
          <Icon
            name="progress-50"
            size="xs"
            className={`${dotsIcon} animate-spin`}
          />
          Loading builds
        </div>
      ) : builds.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground-2">
          No builds yet
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {visibleBuilds(builds, showAll).map((build) => (
              <BuildRow
                key={build.id}
                build={build}
                now={now}
                onOpen={() => onOpenBuild(build)}
              />
            ))}
          </div>
          {hasHiddenBuilds(builds, showAll) && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={showAllClass}
            >
              Show all {builds.length}
            </button>
          )}
        </>
      )}
    </PaneSection>
  );
}

export type MachineSectionViewProps = {
  machine: ThreadMachine;
  now: number;
  focused?: boolean;
  rerunning?: boolean;
  onRerunSetup: () => void;
};

export function MachineSectionView({
  machine,
  now,
  focused = false,
  rerunning = false,
  onRerunSetup,
}: MachineSectionViewProps) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (focused) setOpen(true);
  }, [focused]);
  const rerunnable = canRerunSetup(machine);
  return (
    <PaneSection
      label="This machine"
      count={machineSectionCount(machine.setup.steps)}
      open={open}
      onOpenChange={setOpen}
    >
      {machine.setup.steps.map((step) => (
        <div key={stepKey(step)} className="flex flex-col gap-1.5">
          <div className="flex h-8 items-center gap-2 px-2 text-sm">
            <span className="flex w-4 shrink-0 items-center justify-center">
              <StatusBucketIcon bucket={stepBuckets[step.status]} />
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {stepTitle(step)}
            </span>
            <span className={cx(fadeText, "text-muted-foreground-2")}>
              {step.repoFullName}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
              {stepMeta(step, now)}
            </span>
          </div>
          {step.tail !== undefined && step.tail.trim() !== "" && (
            <div className="mr-2 ml-8 overflow-clip rounded-md border-(length:--border-width-hairline) border-border-1 bg-card">
              <pre className="max-h-60 overflow-auto px-3 py-2 font-mono text-code-block leading-normal whitespace-pre text-muted-foreground-1">
                <span className="block min-w-max">{step.tail.trim()}</span>
              </pre>
            </div>
          )}
          {step.status === "error" && rerunnable && (
            <div className="mr-2 mb-1 ml-8 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={rerunning}
                aria-busy={rerunning || undefined}
                onClick={onRerunSetup}
              >
                <ButtonIcon>
                  <Icon name="rotate" size="sm" />
                </ButtonIcon>
                Run Setup again
              </Button>
            </div>
          )}
        </div>
      ))}
    </PaneSection>
  );
}

function RepositoryHeader({ repository }: { repository: SetupRepository }) {
  return (
    <div className="flex h-7 items-center justify-between gap-2 px-2 text-xs font-medium text-foreground">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{repository.repository}</span>
      </span>
    </div>
  );
}

/**
 * Pane density of Capy's shared/setup repository editor, read-only until the
 * project-setup package ships the editable surface.
 */
export function RepositoryScripts({
  repository,
  focusPhase,
}: {
  repository: SetupRepository;
  focusPhase?: SetupPhase;
}) {
  const focusRef = useRef<HTMLDivElement>(null);
  const focusVisible =
    focusPhase !== undefined && repository.scripts[focusPhase] !== null;
  useEffect(() => {
    if (focusVisible)
      focusRef.current?.scrollIntoView?.({
        block: "start",
        behavior: "smooth",
      });
  }, [focusVisible]);
  return (
    <div className="flex flex-col gap-1">
      <RepositoryHeader repository={repository} />
      {scriptPhases.map((phase) => {
        const script = repository.scripts[phase.key];
        if (script === null) return null;
        const timeout = repository.timeouts[phase.key];
        return (
          <div
            key={phase.key}
            ref={phase.key === focusPhase ? focusRef : undefined}
            data-phase={phase.key}
            className="flex flex-col gap-1"
          >
            <div className="flex min-h-6 items-center gap-2 px-2">
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                {phase.label}
              </span>
              <span className="text-2xs text-muted-foreground-2">Timeout</span>
              <Input
                size="xs"
                className="w-14 text-right tabular-nums"
                inputMode="numeric"
                readOnly
                placeholder={String(phase.defaultTimeout)}
                aria-label={`${phase.label} timeout in seconds`}
                value={timeout === undefined ? "" : String(timeout)}
              />
            </div>
            <pre className="mx-2 max-h-56 overflow-auto rounded-md border-(length:--border-width-hairline) border-border-2 bg-card p-2 font-mono text-code-block leading-normal break-words whitespace-pre-wrap text-foreground">
              {script}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

export function RepositoryEntries({
  repository,
  list,
}: {
  repository: SetupRepository;
  list: "startup" | "commands";
}) {
  const entries = repository[list];
  const readOnly = repository.source === "repo";
  const empty =
    list === "startup"
      ? readOnly
        ? "No startup entries"
        : "No startup entries yet"
      : readOnly
        ? "No commands"
        : "No commands yet";
  return (
    <div className="flex flex-col gap-1">
      <RepositoryHeader repository={repository} />
      <ul
        aria-label={`${entryLists[list].label} in ${repository.repository}`}
        className="mx-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-3 text-xs"
      >
        <span className="text-2xs text-muted-foreground-2">Name</span>
        <span className="text-2xs text-muted-foreground-2">Command</span>
        <span className="text-right text-2xs text-muted-foreground-2">
          Port
        </span>
        {entries.length === 0 ? (
          <span className="col-span-full flex justify-center py-2 text-muted-foreground-2">
            {empty}
          </span>
        ) : (
          entries.map((entry) => (
            <li key={entry.name} className="contents">
              <span className="truncate text-sm font-medium text-foreground">
                {entry.name}
              </span>
              <span
                className={cx(fadeText, "font-mono text-muted-foreground-2")}
              >
                {entry.command}
              </span>
              <span className="text-right text-muted-foreground-2 tabular-nums">
                {entry.port ?? ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function ThreadChangeList({
  changes,
  multiRepo,
  onOpen,
}: {
  changes: ThreadChange[];
  multiRepo: boolean;
  onOpen: (versionId: string, target: ScriptTarget) => void;
}) {
  return (
    <div className="flex flex-col">
      {changes.map(({ versionId, change }, index) => {
        const target = changeTarget(change);
        return (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: changes carry no id of their own
            key={`${versionId}:${index}`}
            type="button"
            disabled={target === undefined}
            onClick={() => target !== undefined && onOpen(versionId, target)}
            className={cx(
              "flex h-8 w-full min-w-0 items-center gap-2 rounded-(--radius) px-2 text-left text-sm",
              rowHover,
            )}
          >
            <span className="min-w-0 truncate font-medium text-foreground">
              {describeChange(change)}
            </span>
            {multiRepo && change.repository !== null && (
              <span className={cx(fadeText, "text-muted-foreground-2")}>
                {change.repository}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type SetupBodyProps = {
  projectId: string;
  setup: LoadedSetup;
  status: SetupStatus;
  builds: SnapshotBuild[] | undefined;
  changes: ThreadChange[];
  now: number;
  machine?: ReactNode;
  focusScript?: ScriptTarget;
  onFocusScript: (versionId: string, target: ScriptTarget) => void;
  onOpenBuild: (build: SnapshotBuild) => void;
};

export function SetupBody({
  projectId,
  setup,
  status,
  builds,
  changes,
  now,
  machine,
  focusScript,
  onFocusScript,
  onOpenBuild,
}: SetupBodyProps) {
  const [scriptsOpen, setScriptsOpen] = useState(true);
  useEffect(() => {
    if (focusScript !== undefined) setScriptsOpen(true);
  }, [focusScript]);
  const repositories = setup.repositories;
  return (
    <div data-slot="setup-view" className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="h-full">
          <div className="flex min-h-full flex-col gap-1 p-2">
            <Link
              to="/settings/projects/$projectId/dev-environment"
              params={{ projectId }}
              className={cx(
                "flex h-8 items-center gap-2 rounded-(--radius) px-2 text-sm",
                rowHover,
              )}
            >
              <span className="flex w-4 shrink-0 items-center justify-center">
                <StatusBucketIcon bucket={status.bucket} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {status.label}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground-2">
                {machineSizeLabel(setup.machineSize)}
              </span>
              <ChevronRightSmallGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
            </Link>
            {machine}
            {changes.length > 0 && (
              <PaneSection
                label="Changed in this thread"
                count={String(changes.length)}
              >
                <ThreadChangeList
                  changes={changes}
                  multiRepo={repositories.length > 1}
                  onOpen={onFocusScript}
                />
              </PaneSection>
            )}
            <PaneSection
              label="Scripts"
              open={scriptsOpen}
              onOpenChange={setScriptsOpen}
              count={String(countScripts(repositories))}
            >
              {repositories.length === 0 ? (
                <div className={emptyCopy}>
                  No scripts yet. Add them in project settings or ask Capy.
                </div>
              ) : (
                repositories.map((repository) => (
                  <RepositoryScripts
                    key={repository.repository}
                    repository={repository}
                    focusPhase={
                      focusScript?.repository === repository.repository
                        ? focusScript.phase
                        : undefined
                    }
                  />
                ))
              )}
            </PaneSection>
            <PaneSection
              label={entryLists.startup.label}
              description={entryLists.startup.description}
              count={String(countStartup(repositories))}
              defaultOpen={false}
            >
              {repositories.length === 0 ? (
                <div className={emptyCopy}>
                  No startup entries yet. Add them in project settings or ask
                  Capy.
                </div>
              ) : (
                repositories.map((repository) => (
                  <RepositoryEntries
                    key={repository.repository}
                    repository={repository}
                    list="startup"
                  />
                ))
              )}
            </PaneSection>
            <PaneSection
              label={entryLists.commands.label}
              description={entryLists.commands.description}
              count={String(countCommands(repositories))}
              defaultOpen={false}
            >
              {repositories.length === 0 ? (
                <div className={emptyCopy}>
                  No commands yet. Add them in project settings or ask Capy.
                </div>
              ) : (
                repositories.map((repository) => (
                  <RepositoryEntries
                    key={repository.repository}
                    repository={repository}
                    list="commands"
                  />
                ))
              )}
            </PaneSection>
            <BuildsSection
              builds={builds}
              now={now}
              onOpenBuild={onOpenBuild}
            />
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}

export function SetupSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-2">
      <div
        role="status"
        aria-label="Loading Setup"
        className="flex animate-skeleton-pulse flex-col gap-2 motion-reduce:animate-none"
      >
        <div className="h-12 rounded-(--radius) bg-secondary" />
        <div className="h-7 rounded-(--radius) bg-secondary" />
        <div className="h-32 rounded-(--radius) bg-secondary" />
      </div>
    </div>
  );
}

export function NoProjectSetup() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground-2">
      This thread has no project, so there is no Setup to show
    </div>
  );
}
