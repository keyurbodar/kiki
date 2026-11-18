import { useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { AppTopBar } from "@/components/app-top-bar";
import { useActiveOrgId } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { pullByNumberAtom } from "./atoms";
import { PullOrgContext } from "./context";
import { ChevronRightSmallIcon } from "./icons";
import { toPull } from "./pull-model";
import { DiffStat, PullStateIcon } from "./pull-parts";
import { PullMenu, type PullTab, PullView, toPullTab } from "./pull-view";
import { resultValue } from "./result";

const track = (owner: string) =>
  `routes/_app/pull.$owner.$repo.$prNumber.tsx#${owner}`;

export type PullPageProps = {
  owner: string;
  repo: string;
  prNumber: string;
  tab?: string;
  org?: string;
  onTabChange: (tab: PullTab) => void;
};

export function PullPage(props: PullPageProps) {
  const activeOrgId = useActiveOrgId();
  const orgId = props.org ?? activeOrgId;
  if (orgId === undefined) return null;
  return (
    <PullOrgContext.Provider value={orgId}>
      <PullPageBody {...props} orgId={orgId} />
    </PullOrgContext.Provider>
  );
}

function PullPageBody({
  owner,
  repo,
  prNumber,
  tab,
  orgId,
  onTabChange,
}: PullPageProps & { orgId: string }) {
  const navigate = useNavigate();
  const result = useAtomValue(
    pullByNumberAtom(orgId, `${owner}/${repo}`, Number(prNumber)),
  );
  const raw = resultValue(result);
  const pull = raw === undefined ? undefined : toPull(raw);
  const missing =
    pull === undefined && AsyncResult.isFailure(result) && raw === undefined;
  const openThread = (jamId: string) =>
    void navigate({ to: "/thread/$threadId", params: { threadId: jamId } });
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <AppTopBar className="flex min-h-11 shrink-0 items-center gap-1.5 border-b-(length:--border-width-hairline) border-border-1 px-3 text-sm">
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link
            data-track-owner={track("PullPage:Link[Pull requests]")}
            to="/pulls"
            className="shrink-0 font-medium text-muted-foreground-2 transition-colors duration-100 hover:text-foreground"
          >
            Pull requests
          </Link>
          <ChevronRightSmallIcon
            aria-hidden
            className="size-(--icon-sm) shrink-0 text-icon-muted"
          />
          {pull === undefined ? (
            <span className="min-w-0 truncate">
              {repo}#{prNumber}
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
              <PullStateIcon state={pull.state} />
              <span className="min-w-0 truncate">{pull.title}</span>
              <span className="shrink-0 text-xs font-normal">
                <DiffStat
                  additions={pull.additions}
                  deletions={pull.deletions}
                  diffBreakdown={pull.diffBreakdown}
                />
              </span>
            </span>
          )}
        </span>
        {pull !== undefined && (
          <span className="flex shrink-0 items-center gap-1">
            <PullMenu pull={pull} onOpenThread={openThread} />
            {pull.threadId !== null && (
              <Tooltip>
                <TooltipTrigger
                  data-track-owner="features/thread/pull-thread-panel.tsx#PullThreadPanelTrigger:TooltipTrigger.1"
                  render={
                    <Button
                      data-track-owner="features/thread/pull-thread-panel.tsx#PullThreadPanelTrigger:Button[Open thread panel]"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Open thread panel"
                      onClick={() =>
                        pull.threadId !== null && openThread(pull.threadId)
                      }
                    />
                  }
                >
                  <Icon name="sidebar-simple-right-wide" size="sm" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Open thread</TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
      </AppTopBar>
      {missing && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <span className="text-sm font-medium text-foreground">
            Pull request not synced yet
          </span>
          <span className="text-sm text-muted-foreground-2">
            It will appear once Capy syncs it from GitHub
          </span>
        </div>
      )}
      {pull !== undefined && (
        <PullView
          key={pull.id}
          pull={pull}
          host="page"
          tab={toPullTab(tab)}
          onTabChange={onTabChange}
          onOpenThread={openThread}
        />
      )}
    </div>
  );
}
