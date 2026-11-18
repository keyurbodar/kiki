import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, type Atom } from "effect/reactivity";
import { type ComponentProps, useRef, useState } from "react";
import {
  joinClasses,
  SelectorCheck,
  SelectorChevron,
  SelectorItemIcon,
  SelectorLayout,
  SelectorRow,
  SelectorSearch,
  SelectorSkeleton,
  SelectorSubmenu,
  selectorEmpty,
  selectorItemLabel,
  selectorTrigger,
} from "@/components/project-select/selector-parts";
import {
  folderDiff,
  folderForRepo,
  type RunOnEntry,
  type RunOnFolder,
  type RunOnPlacement,
  repoShortName,
} from "@/components/run-on-select/entries";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project, ProjectRepo } from "@/data/api/schemas/project";
import { idleAtom } from "@/data/atoms/idle";
import { repoBranchesAtom } from "@/data/atoms/repos";
import { filterItems } from "@/lib/fuzzy-search";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuSeparator, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Switch } from "@/primitives/switch";

export const branchSearchThreshold = 8;

type Repo = Pick<ProjectRepo, "repoFullName" | "baseBranch">;

export type BranchSelection = Readonly<Record<string, string>>;

export const selectedBranch = (selection: BranchSelection, repo: Repo) =>
  selection[repo.repoFullName] ?? repo.baseBranch;

export type CloneSlot =
  | { phase: "cloning"; percent: number; onCancel: () => void }
  | { phase: "done" | "failed"; onDismiss: () => void };

export type DeviceRun = {
  entry: RunOnEntry;
  placement: RunOnPlacement;
  on: Readonly<Record<string, boolean>>;
  cloned: readonly string[];
  onToggle: (repoFullName: string, on: boolean) => void;
  onCloneStart?: (repoFullName: string) => void;
  cloneSlot?: (repoFullName: string) => CloneSlot | undefined;
};

export function multiRepoLabel(
  repos: readonly Repo[],
  selection: BranchSelection,
  isOn: (repo: Repo) => boolean = () => true,
) {
  const enabled = repos.filter(isOn);
  const changed = enabled.filter(
    (r) => selectedBranch(selection, r) !== r.baseBranch,
  );
  const only = changed[0];
  if (enabled.length < repos.length)
    return `${enabled.length} of ${repos.length} repos`;
  if (changed.length === 1 && only !== undefined)
    return `${repoShortName(only.repoFullName)} · ${selectedBranch(selection, only)}`;
  return `${repos.length} repos`;
}

export function branchList(
  baseBranch: string,
  branches: readonly string[] | undefined,
) {
  return [baseBranch, ...(branches ?? []).filter((b) => b !== baseBranch)];
}

const branchName = (branch: unknown) =>
  typeof branch === "string"
    ? branch
    : typeof branch === "object" && branch !== null && "name" in branch
      ? String((branch as { name: unknown }).name)
      : undefined;

const idleBranches = idleAtom();

function useBranches(orgId: OrgId | undefined, repo: string) {
  const atom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    orgId === undefined ? idleBranches : repoBranchesAtom(orgId, repo);
  const result = useAtomValue(atom);
  if (orgId === undefined) return { branches: undefined, waiting: false };
  const value = AsyncResult.isSuccess(result) ? result.value : undefined;
  return {
    branches: Array.isArray(value)
      ? value.map(branchName).filter((b): b is string => b !== undefined)
      : undefined,
    waiting: result.waiting || AsyncResult.isInitial(result),
  };
}

export type BranchRowsProps = {
  orgId?: OrgId;
  repo: Repo;
  selected: string;
  onSelect: (branch: string) => void;
  closeOnClick?: boolean;
  branches?: readonly string[];
};

function BranchSkeletonRow({ width }: { width: string }) {
  return (
    <div className="flex h-(--h-menu-row) items-center gap-2 px-2">
      <SelectorSkeleton className="size-(--icon-sm)" />
      <SelectorSkeleton className={joinClasses("h-3", width)} />
    </div>
  );
}

export function BranchRows({
  orgId,
  repo,
  selected,
  onSelect,
  closeOnClick,
  branches: override,
}: BranchRowsProps) {
  const [query, setQuery] = useState("");
  const loaded = useBranches(
    override === undefined ? orgId : undefined,
    repo.repoFullName,
  );
  const all = branchList(repo.baseBranch, override ?? loaded.branches);
  const visible = filterItems(all, (b) => [b], query);
  const waiting = override === undefined && loaded.waiting;
  return (
    <>
      {all.length >= branchSearchThreshold ? (
        <SelectorSearch
          placeholder="Search branches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      {visible.length === 0 ? (
        <div className={selectorEmpty}>
          {waiting ? "Loading branches…" : "No branches found"}
        </div>
      ) : (
        visible.map((branch) => (
          <ResponsiveMenuItem
            key={branch}
            data-track-owner="shared/new-thread/repo-branch-select.tsx#BranchRowsContent:ResponsiveMenuItem.1"
            closeOnClick={closeOnClick}
            onClick={() => onSelect(branch)}
          >
            <SelectorItemIcon name="branch-simple" />
            <span className={selectorItemLabel}>{branch}</span>
            {branch === repo.baseBranch ? (
              <span className="shrink-0 text-2xs font-normal text-muted-foreground-3">
                Default
              </span>
            ) : null}
            {branch === selected ? <SelectorCheck className="ml-auto" /> : null}
          </ResponsiveMenuItem>
        ))
      )}
      {visible.length > 0 && waiting ? (
        <>
          <BranchSkeletonRow width="w-24" />
          <BranchSkeletonRow width="w-16" />
        </>
      ) : null}
    </>
  );
}

function FolderSummary({ folder }: { folder: RunOnFolder }) {
  const diff = folderDiff(folder);
  const parts = [
    folder.branch,
    diff === undefined ? undefined : (
      <span key="diff" className="shrink-0 tabular-nums">
        <span className="text-diff-add">+{diff.insertions}</span>{" "}
        <span className="text-diff-del">-{diff.deletions}</span>
      </span>
    ),
  ].filter((part) => part !== undefined);
  return (
    <>
      {parts.map((part, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed two-part summary
        <span key={index}>
          {index > 0 ? " · " : null}
          {part}
        </span>
      ))}
    </>
  );
}

type SingleBranchSelectProps = {
  orgId?: OrgId;
  repo: Repo;
  value: string;
  onValueChange: (branch: string) => void;
  className?: string;
  defaultOpen?: boolean;
  branches?: readonly string[];
};

function SingleBranchSelect({
  orgId,
  repo,
  value,
  onValueChange,
  className,
  defaultOpen,
  branches,
}: SingleBranchSelectProps) {
  return (
    <ResponsiveMenu defaultOpen={defaultOpen}>
      <MenuTrigger
        data-track-owner="shared/new-thread/repo-branch-select.tsx#SingleBranchSelect:ResponsiveMenuTrigger.1"
        render={
          <Button
            data-track-owner="shared/new-thread/repo-branch-select.tsx#SingleBranchSelect:Button[Branch]"
            variant="bare"
            size="auto-sm"
            aria-label="Branch"
            className={joinClasses(selectorTrigger, className)}
          />
        }
      >
        <Icon name="branch-simple" size="sm" />
        <span className="min-w-0 truncate">{value}</span>
        <SelectorChevron />
      </MenuTrigger>
      <MenuContent align="end" className="w-64">
        <BranchRows
          orgId={orgId}
          repo={repo}
          selected={value}
          onSelect={onValueChange}
          branches={branches}
        />
      </MenuContent>
    </ResponsiveMenu>
  );
}

function DeviceRepoRow({
  orgId,
  repo,
  run,
  on,
  branch,
  onBranch,
  onCloseMenu,
  branches,
}: {
  orgId?: OrgId;
  repo: Repo;
  run: DeviceRun;
  on: boolean;
  branch: string;
  onBranch: (branch: string) => void;
  onCloseMenu: () => void;
  branches?: readonly string[];
}) {
  const folder = folderForRepo(run.entry, repo.repoFullName);
  const slot = run.cloneSlot?.(repo.repoFullName);
  const pickable = folder !== undefined && on && run.placement === "worktree";
  const switchRef = useRef<HTMLSpanElement>(null);
  const startClone = () => {
    onCloseMenu();
    run.onCloneStart?.(repo.repoFullName);
  };
  const toggle = (next: boolean) => {
    if (slot !== undefined) {
      if (next) return;
      if (slot.phase === "cloning") slot.onCancel();
      else slot.onDismiss();
      return;
    }
    if (pickable && !next)
      switchRef.current
        ?.closest<HTMLElement>('[role="menu"]')
        ?.focus({ preventScroll: true });
    if (folder !== undefined || !next) run.onToggle(repo.repoFullName, next);
    else startClone();
  };
  const switchControl = (
    // biome-ignore lint/a11y/noStaticElementInteractions: stops the row from handling the switch's own click
    // biome-ignore lint/a11y/useKeyWithClickEvents: the switch handles keyboard input
    <span
      data-track-owner="shared/new-thread/repo-branch-select.tsx#DeviceRepoRow:span.1"
      ref={switchRef}
      className="flex shrink-0 items-center"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <Switch
        data-track-owner="shared/new-thread/repo-branch-select.tsx#DeviceRepoRow:Switch.1"
        checked={slot !== undefined || on}
        onCheckedChange={toggle}
      />
    </span>
  );
  if (pickable)
    return (
      <SelectorSubmenu
        icon={<Icon name="github" size="sm" />}
        label={repoShortName(repo.repoFullName)}
        value={
          <>
            <Icon name="branch-simple" size="sm" />
            <span className="min-w-0 truncate">{branch}</span>
          </>
        }
        valueClassName="flex max-w-40 items-center gap-1"
        trailing={switchControl}
        contentClassName="w-60"
      >
        <BranchRows
          orgId={orgId}
          repo={repo}
          selected={branch}
          onSelect={onBranch}
          closeOnClick={false}
          branches={branches}
        />
      </SelectorSubmenu>
    );
  const description =
    folder !== undefined && on && run.placement === "linked" ? (
      <>
        <FolderSummary folder={folder} />
        {run.cloned.includes(repo.repoFullName) ? " · Fresh clone" : null}
      </>
    ) : undefined;
  const density = description === undefined ? undefined : "rich";
  return (
    <>
      <ResponsiveMenuItem
        data-track-owner="shared/new-thread/repo-branch-select.tsx#DeviceRepoRow:ResponsiveMenuItem.1"
        data-density={density}
        closeOnClick={false}
        onClick={() => {
          if (slot !== undefined) return;
          if (folder !== undefined || on) run.onToggle(repo.repoFullName, !on);
          else startClone();
        }}
      >
        <SelectorRow
          density={density}
          icon={<Icon name="github" size="sm" />}
          label={repoShortName(repo.repoFullName)}
          description={description}
          trailing={switchControl}
        />
      </ResponsiveMenuItem>
      {slot?.phase === "cloning" ? (
        <div className="flex items-center gap-2 px-2 pt-0.5 pb-1.5 pl-8 text-xs font-normal text-muted-foreground-1">
          <DotGridIcon size="xs" label="Cloning" />
          <span>Cloning · {slot.percent}%</span>
        </div>
      ) : null}
    </>
  );
}

type MultiRepoSelectProps = {
  orgId?: OrgId;
  project: Pick<Project, "repos">;
  selection: BranchSelection;
  onSelectionChange: (selection: BranchSelection) => void;
  className?: string;
  deviceRun?: DeviceRun;
  defaultOpen?: boolean;
  onAddRepositories?: () => void;
  branches?: Readonly<Record<string, readonly string[]>>;
};

function MultiRepoSelect({
  orgId,
  project,
  selection,
  onSelectionChange,
  className,
  deviceRun,
  defaultOpen,
  onAddRepositories,
  branches,
}: MultiRepoSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(defaultOpen ?? false);
  const isOn = (repo: Repo) =>
    deviceRun === undefined || deviceRun.on[repo.repoFullName] === true;
  const repos = filterItems(
    project.repos,
    (r) => [repoShortName(r.repoFullName)],
    query,
  );
  return (
    <ResponsiveMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <MenuTrigger
        data-track-owner="shared/new-thread/repo-branch-select.tsx#MultiRepoSelect:ResponsiveMenuTrigger.1"
        render={
          <Button
            data-track-owner="shared/new-thread/repo-branch-select.tsx#MultiRepoSelect:Button[Repositories and branches]"
            variant="bare"
            size="auto-sm"
            aria-label="Repositories and branches"
            className={joinClasses(selectorTrigger, className)}
          />
        }
      >
        <Icon name="github" size="sm" />
        <span className="min-w-0 truncate">
          {multiRepoLabel(project.repos, selection, isOn)}
        </span>
        <SelectorChevron />
      </MenuTrigger>
      <MenuContent align="end" className="w-80">
        <SelectorLayout
          search={
            project.repos.length >= branchSearchThreshold ? (
              <SelectorSearch
                placeholder="Search repositories"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            ) : null
          }
          footer={
            <>
              <MenuSeparator />
              <ResponsiveMenuItem
                data-track-owner="shared/new-thread/repo-branch-select.tsx#MultiRepoSelect:ResponsiveMenuItem[Add repositories]"
                onClick={onAddRepositories}
              >
                <SelectorItemIcon name="plus-large" />
                Add repositories
              </ResponsiveMenuItem>
            </>
          }
        >
          {repos.length === 0 ? (
            <div className={selectorEmpty}>No repositories found</div>
          ) : (
            repos.map((repo) =>
              deviceRun === undefined ? (
                <SelectorSubmenu
                  key={repo.repoFullName}
                  icon={<Icon name="github" size="sm" />}
                  label={repoShortName(repo.repoFullName)}
                  value={selectedBranch(selection, repo)}
                  contentClassName="w-60"
                >
                  <BranchRows
                    orgId={orgId}
                    repo={repo}
                    selected={selectedBranch(selection, repo)}
                    closeOnClick={false}
                    onSelect={(branch) =>
                      onSelectionChange({
                        ...selection,
                        [repo.repoFullName]: branch,
                      })
                    }
                    branches={branches?.[repo.repoFullName]}
                  />
                </SelectorSubmenu>
              ) : (
                <DeviceRepoRow
                  key={repo.repoFullName}
                  orgId={orgId}
                  repo={repo}
                  run={deviceRun}
                  on={isOn(repo)}
                  branch={selectedBranch(selection, repo)}
                  onBranch={(branch) =>
                    onSelectionChange({
                      ...selection,
                      [repo.repoFullName]: branch,
                    })
                  }
                  onCloseMenu={() => setOpen(false)}
                  branches={branches?.[repo.repoFullName]}
                />
              ),
            )
          )}
        </SelectorLayout>
      </MenuContent>
    </ResponsiveMenu>
  );
}

export type RepoBranchSelectProps = Omit<ComponentProps<"div">, "children"> & {
  orgId?: OrgId;
  project?: Pick<Project, "repos">;
  selection?: BranchSelection;
  onSelectionChange?: (selection: BranchSelection) => void;
  defaultOpen?: boolean;
  deviceRun?: DeviceRun;
  onAddRepositories?: () => void;
  branches?: Readonly<Record<string, readonly string[]>>;
};

export function RepoBranchSelect({
  orgId,
  project,
  selection = {},
  onSelectionChange,
  className,
  defaultOpen,
  deviceRun,
  onAddRepositories,
  branches,
  ...props
}: RepoBranchSelectProps) {
  if (project === undefined || project.repos.length === 0) return null;
  const change = (next: BranchSelection) => onSelectionChange?.(next);
  const first = project.repos[0];
  if (first === undefined) return null;

  if (
    deviceRun !== undefined &&
    deviceRun.placement === "linked" &&
    project.repos.length === 1
  ) {
    const folder = folderForRepo(deviceRun.entry, first.repoFullName);
    if (folder === undefined || folder.branch === undefined) return null;
    return (
      <div data-slot="repo-branch-select" {...props}>
        <span
          className={joinClasses(
            "flex min-w-0 items-center gap-1 text-sm text-muted-foreground-1",
            className,
          )}
        >
          <Icon name="branch-simple" size="sm" />
          <span className="min-w-0 truncate">
            <FolderSummary folder={folder} />
          </span>
        </span>
      </div>
    );
  }

  return (
    <div data-slot="repo-branch-select" {...props}>
      {project.repos.length === 1 ? (
        <SingleBranchSelect
          orgId={orgId}
          repo={first}
          value={selectedBranch(selection, first)}
          onValueChange={(branch) => change({ [first.repoFullName]: branch })}
          className={className}
          defaultOpen={defaultOpen}
          branches={branches?.[first.repoFullName]}
        />
      ) : (
        <MultiRepoSelect
          orgId={orgId}
          project={project}
          selection={selection}
          onSelectionChange={change}
          className={className}
          deviceRun={deviceRun}
          defaultOpen={defaultOpen}
          onAddRepositories={onAddRepositories}
          branches={branches}
        />
      )}
    </div>
  );
}
