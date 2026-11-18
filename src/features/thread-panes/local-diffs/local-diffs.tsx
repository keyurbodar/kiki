import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import { ApiClient } from "@/data/client/ApiClient";
import { DiffBodyCard } from "@/features/thread/diff-body";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { changedPathsCount, type LocalDiffRepo } from "./logic";

export type LocalDiffTarget = {
  orgId: string;
  jamId: string;
};

function EmptyState({
  line,
  sub,
  art,
  action,
}: {
  line: string;
  sub?: string;
  art: "review" | "sleep";
  action?: ReactNode;
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

export function LaunchActions({ children }: { children?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1 px-1">
      <Button variant="ghost" size="xs" className="shrink-0">
        Open in…
        <Icon name="chevron-down-small" />
      </Button>
      {children}
    </div>
  );
}

const statusAtom = (params: { orgId: string; jamId: string }) =>
  ApiClient.query("git", "status", {
    params,
    reactivityKeys: [`git:${params.jamId}`],
  });

const patchAtom = (params: { orgId: string; jamId: string }) =>
  ApiClient.query("git", "patch", {
    params,
    query: {},
    reactivityKeys: [`git:${params.jamId}`],
  });

function readChanged(value: unknown): Array<{ path: string }> {
  if (typeof value !== "object" || value === null) return [];
  const changes = (value as { changes?: unknown }).changes;
  if (!Array.isArray(changes)) return [];
  return changes.flatMap((change) =>
    typeof change === "object" &&
    change !== null &&
    typeof (change as { path?: unknown }).path === "string"
      ? [{ path: (change as { path: string }).path }]
      : [],
  );
}

function readPatch(value: unknown): LocalDiffRepo {
  if (typeof value !== "object" || value === null) {
    return { repo: ".", branch: null, entries: [] };
  }
  const data = value as Record<string, unknown>;
  const files = Array.isArray(data.files) ? data.files : [];
  return {
    repo: typeof data.repo === "string" ? data.repo : ".",
    branch: typeof data.branch === "string" ? data.branch : null,
    entries: files.flatMap((file) => {
      if (typeof file !== "object" || file === null) return [];
      const entry = file as Record<string, unknown>;
      if (typeof entry.path !== "string") return [];
      return [
        {
          repo: ".",
          path: entry.path,
          patch: typeof entry.diff === "string" ? entry.diff : null,
        },
      ];
    }),
  };
}

export function LocalDiffsView({ target }: { target: LocalDiffTarget }) {
  const params = { orgId: target.orgId, jamId: target.jamId };
  const status = useAtomValue(statusAtom(params));
  const patch = useAtomValue(patchAtom(params));
  const [activePath, setActivePath] = useState<string>();
  const refreshStatus = useAtomRefresh(statusAtom(params));
  const refreshPatch = useAtomRefresh(patchAtom(params));

  // A failed read is not a read still on its way: say which one this is.
  if (AsyncResult.isFailure(status)) {
    return (
      <FailedRead
        slot="local-diffs-load-failed"
        line="Couldn't load local changes"
        sub="This device's working tree did not load"
        onRetry={() => {
          refreshStatus();
          refreshPatch();
        }}
      />
    );
  }
  if (!AsyncResult.isSuccess(status)) {
    return (
      <EmptyState
        line="Local diff unavailable"
        sub="Loading local changes"
        art="sleep"
      />
    );
  }
  const changed = readChanged(status.value);
  if (changed.length === 0) {
    return (
      <EmptyState
        line="No local changes"
        sub="The working tree on this device is clean"
        art="review"
      />
    );
  }
  const repo = readPatch(
    AsyncResult.isSuccess(patch) ? patch.value : undefined,
  );
  const repos: LocalDiffRepo[] = [
    {
      ...repo,
      entries: repo.entries.filter((entry) =>
        changed.some((change) => change.path === entry.path),
      ),
    },
  ];
  const files = repos.flatMap((entry) => entry.entries);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground-2">
          {changedPathsCount([
            { dirtyPaths: changed.map((change) => change.path) },
          ])}{" "}
          changed on this device
        </span>
        <span className="min-w-0 flex-1" />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Refresh"
                onClick={() => {
                  refreshStatus();
                  refreshPatch();
                }}
              >
                <Icon name="arrow-rotate-clockwise" />
              </Button>
            }
          />
          <TooltipContent side="bottom">Refresh</TooltipContent>
        </Tooltip>
        <LaunchActions />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {files.map((file) => (
          <div key={`${file.repo}:${file.path}`}>
            <DiffBodyCard
              patch={file.patch ?? `--- a/${file.path}\n+++ b/${file.path}`}
              path={file.path}
              openDiff={() => setActivePath(file.path)}
              expandable
            />
          </div>
        ))}
      </div>
      {activePath !== undefined ? (
        <span className="sr-only">Opened {activePath}</span>
      ) : null}
    </div>
  );
}
