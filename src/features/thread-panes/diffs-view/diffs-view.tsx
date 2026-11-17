import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { DiffStat } from "@/components/diff-stat";
import {
  CollapseAllButton,
  DiffDisplayMenu,
  DiffFilesMenu,
} from "@/components/diff-toolbar";
import { ApiClient } from "@/data/client/ApiClient";
import { DiffBodyCard } from "@/features/thread/diff-body";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  availableScopes,
  changedPatchFiles,
  type DiffScope,
  type DiffTurn,
  defaultScope,
  filterTurns,
  groupTurns,
  patchTotals,
  pickTurn,
  rangeLabel,
  scopeLabels,
} from "./logic";

export type DiffsViewProps = { threadId: string };

const gitParams = (threadId: string) => ({
  orgId: "org_sample_acme",
  jamId: threadId,
});

const statusAtom = (threadId: string) =>
  ApiClient.query("git", "status", {
    params: gitParams(threadId),
    reactivityKeys: [`git:${threadId}`],
  });

const patchAtom = (threadId: string) =>
  ApiClient.query("git", "patch", {
    params: gitParams(threadId),
    query: {},
    reactivityKeys: [`git:${threadId}`],
  });

const turnsAtom = (threadId: string) =>
  ApiClient.query("git", "turns", {
    params: gitParams(threadId),
    reactivityKeys: [`git:${threadId}`],
  });

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-9 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2">
      {children}
    </div>
  );
}

function EmptyState({
  line,
  sub,
  art = "review",
  action,
}: {
  line: string;
  sub?: string;
  art?: "review" | "sleep";
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art === "sleep" ? "/art/sleep.svg" : "/art/review.svg"}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
        {line}
      </span>
      {sub !== undefined ? (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      ) : null}
      {action}
    </div>
  );
}

export function DiffsSkeleton() {
  return (
    <SkeletonPanel label="Loading diffs" className="flex flex-col gap-1 p-2">
      {[40, 52, 32, 44].map((width) => (
        <div key={width} className="flex h-7 items-center gap-2 px-2">
          <Icon name="code-tree" className="size-3.5 shrink-0" />
          <SkeletonPanel className={`h-3 w-${width}`} />
          <SkeletonPanel className="ml-auto h-3 w-10 shrink-0" />
        </div>
      ))}
    </SkeletonPanel>
  );
}

function asTurns(value: unknown): DiffTurn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const turn = entry as Record<string, unknown>;
    if (typeof turn.id !== "string") return [];
    const repos = Array.isArray(turn.repos)
      ? turn.repos.flatMap((repo) =>
          typeof repo === "string" ? [{ repo, scopes: ["turn"] }] : [],
        )
      : [{ repo: "acme/web", scopes: ["turn"] }];
    const files = Array.isArray(turn.files) ? turn.files.length : 0;
    return [
      {
        eventId: turn.id,
        repos,
        additions: typeof turn.additions === "number" ? turn.additions : files,
        deletions: typeof turn.deletions === "number" ? turn.deletions : 0,
        title: typeof turn.summary === "string" ? turn.summary : undefined,
      },
    ];
  });
}

function ScopeMenu({
  scopes,
  active,
  onScope,
}: {
  scopes: ReadonlySet<DiffScope["scope"]>;
  active: DiffScope | null;
  onScope: (scope: DiffScope) => void;
}) {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="xs" />}>
        {active === null ? "Scope" : scopeLabels[active.scope]}
        <Icon name="chevron-down-small" />
      </MenuTrigger>
      <MenuContent align="start" className="w-48">
        {(["pr-preview", "uncommitted", "turn"] as const).map((scope) =>
          scopes.has(scope) ? (
            <MenuItem
              key={scope}
              onClick={() =>
                onScope(
                  scope === "turn"
                    ? { scope, from: "", through: "" }
                    : { scope },
                )
              }
            >
              {scopeLabels[scope]}
              {active?.scope === scope ? (
                <Icon name="checkmark-1" className="ml-auto size-(--icon-sm)" />
              ) : null}
            </MenuItem>
          ) : null,
        )}
      </MenuContent>
    </Menu>
  );
}

function TurnPicker({
  turns,
  active,
  onRange,
}: {
  turns: ReadonlyArray<DiffTurn>;
  active: DiffScope | null;
  onRange: (from: string, through: string) => void;
}) {
  const [query, setQuery] = useState("");
  const from = Math.max(
    0,
    active?.scope === "turn"
      ? turns.findIndex((turn) => turn.eventId === active.from)
      : 0,
  );
  const through = Math.max(
    from,
    active?.scope === "turn"
      ? turns.findIndex((turn) => turn.eventId === active.through)
      : 0,
  );
  const label = rangeLabel(from, through, turns.length);
  const move = (delta: number) => {
    const next = (delta < 0 ? from : through) + delta;
    const range = pickTurn(next, from, through, false, turns);
    if (range !== undefined) onRange(range.from, range.through);
  };
  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="ghost" size="xs" />}>
          {label}
          <Icon name="chevron-down-small" />
        </MenuTrigger>
        <MenuContent align="start" className="w-80">
          <input
            aria-label="Search turns"
            placeholder="Search turns"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            className="h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground-3"
          />
          {filterTurns(turns, query).map(({ turn, index, title }) => (
            <MenuItem
              key={turn.eventId}
              onClick={(event) => {
                const range = pickTurn(
                  index,
                  from,
                  through,
                  (event as unknown as MouseEvent).shiftKey,
                  turns,
                );
                if (range !== undefined) onRange(range.from, range.through);
              }}
            >
              <span className="w-5 shrink-0 text-xs text-muted-foreground-3 tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">{title}</span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 text-2xs tabular-nums">
                <span className="text-diff-add">+{turn.additions}</span>{" "}
                <span className="text-diff-del">-{turn.deletions}</span>
              </span>
            </MenuItem>
          ))}
          {turns.length > 1 ? (
            <div className="mt-1 flex min-h-22 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0">
              Shift-click a turn to select a range
            </div>
          ) : null}
        </MenuContent>
      </Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Previous turn"
              disabled={from <= 0}
              onClick={() => move(-1)}
            >
              <Icon name="chevron-left-small" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Previous turn</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Next turn"
              disabled={through >= turns.length - 1}
              onClick={() => move(1)}
            >
              <Icon name="chevron-right-small" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Next turn</TooltipContent>
      </Tooltip>
    </>
  );
}

export function DiffsView({ threadId }: DiffsViewProps) {
  const status = useAtomValue(statusAtom(threadId));
  const patch = useAtomValue(patchAtom(threadId));
  const turnsResult = useAtomValue(turnsAtom(threadId));
  const [choice, setChoice] = useState<DiffScope | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activePath, setActivePath] = useState<string>();

  if (!AsyncResult.isSuccess(status)) return <DiffsSkeleton />;
  const turns = groupTurns(
    asTurns(AsyncResult.isSuccess(turnsResult) ? turnsResult.value : undefined),
  );
  const scopes = availableScopes(turns);
  const changedPaths = new Set(
    (status.value as { changes?: Array<{ path: string }> }).changes?.map(
      (change) => change.path,
    ) ?? [],
  );
  const files = changedPatchFiles(
    AsyncResult.isSuccess(patch) ? patch.value : undefined,
    changedPaths,
  );
  const totals = patchTotals(files);
  const scope = defaultScope(scopes, turns, choice);
  const changeScope = (next: DiffScope) => {
    setChoice(next);
  };

  if (files.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Toolbar />
        <EmptyState
          line="No changes yet"
          sub="Diffs show up here as Capy works"
        />
      </div>
    );
  }

  const allCollapsed = files.every(() => collapsed);
  return (
    <div className="flex min-h-0 flex-1 flex-col outline-none" tabIndex={-1}>
      <Toolbar>
        <ScopeMenu scopes={scopes} active={scope} onScope={changeScope} />
        {scope?.scope === "turn" && turns.length > 0 ? (
          <TurnPicker
            turns={turns}
            active={scope}
            onRange={(from, through) =>
              changeScope({ scope: "turn", from, through })
            }
          />
        ) : null}
        <span className="min-w-0 flex-1" />
        <DiffStat additions={totals.additions} deletions={totals.deletions} />
        <DiffFilesMenu
          files={files}
          onOpenFile={setActivePath}
          className="shrink-0"
        />
        <CollapseAllButton
          allCollapsed={allCollapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <DiffDisplayMenu />
        <Menu>
          <MenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
            <Icon name="console-sparkle" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem>Refresh</MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => toast.error("Could not save line wrapping")}
            >
              Wrap lines
            </MenuItem>
          </MenuContent>
        </Menu>
      </Toolbar>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {files.map((file) => (
          <div
            key={file.path}
            className={cx(
              "rounded-(--radius-card) border-hairline border-border-1 px-3 py-2",
              file.path === activePath && "bg-accent",
            )}
          >
            {file.patch === null ? (
              <span className="text-xs text-muted-foreground-2">
                {file.path}
              </span>
            ) : (
              <DiffBodyCard patch={file.patch ?? ""} path={file.path} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
