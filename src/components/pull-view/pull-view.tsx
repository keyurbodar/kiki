import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { cx } from "@/components/activity-card";
import { CapyMark } from "@/components/capy-logo";
import { OverviewTab } from "@/components/overview-tab";
import { PullViewTab } from "@/components/pull-view-tab";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  closePullAtom,
  mergePullAtom,
  pullDiffAtom,
  pullReactivityKeys,
  pullReviewAtom,
  pullThreadsAtom,
  reopenPullAtom,
  setDraftAtom,
} from "./atoms";
import { copyText } from "./clipboard";
import { usePullOrgId } from "./context";
import {
  buildFileTree,
  type FileTreeNode,
  filterFiles,
  toDiffFiles,
} from "./file-tree-model";
import {
  ArrowShareRightIcon,
  BranchIcon,
  Bubble2Icon,
  ChevronDownSmallIcon,
  ChevronRightSmallIcon,
  CrossMediumIcon,
  DotGrid1x3HorizontalIcon,
  DraftIcon,
  MergedIcon,
  PlusLargeIcon,
  PullRequestIcon,
  SquareBehindSquare2Icon,
} from "./icons";
import {
  type Pull,
  type PullThreadRef,
  repoName,
  toThreadRefs,
} from "./pull-model";
import { PullStateIcon } from "./pull-parts";
import { resultValue } from "./result";

const track = (owner: string) => `shared/pull-view/pull-view.tsx#${owner}`;

export const menuIconSlotClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

const shortcutClassName =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export type PullTab = "overview" | "guide" | "diff";

export const pullTabs: ReadonlyArray<PullTab> = ["overview", "guide", "diff"];

export const toPullTab = (value: string | undefined): PullTab =>
  pullTabs.find((tab) => tab === value) ?? "overview";

export const usePullThreads = (pull: Pull): ReadonlyArray<PullThreadRef> => {
  const orgId = usePullOrgId();
  const result = resultValue(useAtomValue(pullThreadsAtom(orgId, pull.id)));
  if (result !== undefined) return toThreadRefs(result);
  return pull.threadId === null ? [] : [{ id: pull.threadId, title: null }];
};

export function ThreadMenuItem({
  thread,
  onOpen,
}: {
  thread: PullThreadRef;
  onOpen: (jamId: string) => void;
}) {
  return (
    <MenuItem
      data-track-owner={track("ThreadMenuItem:ResponsiveMenuItem.1")}
      onClick={() => onOpen(thread.id)}
    >
      <span className={cx(menuIconSlotClassName, "empty:hidden")}>
        <Icon name="studio-display" size="sm" />
      </span>
      <span className="min-w-0 truncate">
        {thread.title ?? "Untitled thread"}
      </span>
    </MenuItem>
  );
}

export function PullThreadMenuItems({
  threads,
  onOpenThread,
  onChatWithCapy,
}: {
  threads: ReadonlyArray<PullThreadRef>;
  onOpenThread: (jamId: string) => void;
  onChatWithCapy?: () => void;
}) {
  return (
    <>
      {threads.map((thread) => (
        <ThreadMenuItem key={thread.id} thread={thread} onOpen={onOpenThread} />
      ))}
      {onChatWithCapy !== undefined && (
        <>
          {threads.length > 0 && <MenuSeparator />}
          <MenuItem
            data-track-owner={track(
              "PullThreadMenuItems:ResponsiveMenuItem[New thread with PR]",
            )}
            onClick={onChatWithCapy}
          >
            <span className={menuIconSlotClassName}>
              <PlusLargeIcon className="size-(--icon-sm)" />
            </span>
            New thread with PR
          </MenuItem>
        </>
      )}
    </>
  );
}

export type ChatWithCapyButtonProps = {
  pull: Pull;
  onOpenThread: (jamId: string) => void;
  onChatWithCapy?: () => void;
  foldEarly?: boolean;
};

export function ChatWithCapyButton({
  pull,
  onOpenThread,
  onChatWithCapy,
  foldEarly = false,
}: ChatWithCapyButtonProps) {
  const threads = usePullThreads(pull);
  const target =
    pull.threadId !== null
      ? ({ kind: "thread", jamId: pull.threadId } as const)
      : threads[0] !== undefined
        ? ({ kind: "thread", jamId: threads[0].id } as const)
        : ({ kind: "chat" } as const);
  if (target.kind === "chat" && onChatWithCapy === undefined) return null;
  const segmented =
    threads.length > (target.kind === "thread" ? 1 : 0) ||
    (target.kind === "thread" && onChatWithCapy !== undefined);
  const reveal = foldEarly ? "@2xl/pull:inline-flex" : "@lg/pull:inline-flex";
  const button = (
    <Tooltip>
      <TooltipTrigger
        data-track-owner={track("ChatWithCapyButton:TooltipTrigger.1")}
        render={
          <Button
            data-track-owner={track(
              "ChatWithCapyButton:Button[Chat with Capy]",
            )}
            size="sm"
            shape={segmented ? "segment-start" : "default"}
            aria-label="Chat with Capy"
            className={cx(
              segmented ? "inline-flex" : `hidden ${reveal}`,
              "@max-3xl/pull:w-(--h-control-sm) @max-3xl/pull:px-0",
            )}
            onClick={() =>
              target.kind === "thread"
                ? onOpenThread(target.jamId)
                : onChatWithCapy?.()
            }
          >
            <span className="@max-3xl/pull:mx-0">
              <CapyMark className="h-(--icon-sm) w-auto" />
            </span>
            <span className="@max-3xl/pull:hidden">Chat with Capy</span>
          </Button>
        }
      />
      <TooltipContent side="bottom">
        {target.kind === "thread"
          ? "Open the linked thread"
          : "Start a thread with this pull"}
      </TooltipContent>
    </Tooltip>
  );
  if (!segmented) return button;
  return (
    <span
      className={cx(
        "hidden items-center rounded-(--radius) shadow-plate",
        foldEarly ? "@2xl/pull:flex" : "@lg/pull:flex",
      )}
    >
      {button}
      <Menu>
        <MenuTrigger
          data-track-owner={track("ChatWithCapyButton:ResponsiveMenuTrigger.1")}
          render={
            <Button
              data-track-owner={track(
                "ChatWithCapyButton:Button[Thread options]",
              )}
              size="icon-sm-narrow"
              shape="segment-end"
              aria-label="Thread options"
            />
          }
        >
          <ChevronDownSmallIcon className="size-(--icon-sm)" />
        </MenuTrigger>
        <MenuContent className="w-64" align="end" finalFocus={false}>
          <PullThreadMenuItems
            threads={threads}
            onOpenThread={onOpenThread}
            onChatWithCapy={onChatWithCapy}
          />
        </MenuContent>
      </Menu>
    </span>
  );
}

const appOrigin = () =>
  typeof window === "undefined" ? "" : window.location.origin;

export const pullLink = (pull: Pull, orgId: string) =>
  `${appOrigin()}/pull/${pull.repo}/${pull.number}?org=${orgId}`;

const copyPullLink = (pull: Pull, url: string, label?: string) =>
  copyText(
    url,
    "Link copied",
    "Could not copy link",
    label ?? `${repoName(pull.repo)}#${pull.number}`,
  );

function MenuSubmenu({
  icon,
  label,
  className,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <span className={menuIconSlotClassName}>{icon}</span>
        {label}
      </MenuSubTrigger>
      <MenuContent className={className}>{children}</MenuContent>
    </MenuSub>
  );
}

export type PullMenuProps = {
  pull: Pull;
  onOpenThread?: (jamId: string) => void;
  onChatWithCapy?: () => void;
};

export function PullMenu({
  pull,
  onOpenThread,
  onChatWithCapy,
}: PullMenuProps) {
  const orgId = usePullOrgId();
  const threads = usePullThreads(pull);
  const setDraft = useAtomSet(setDraftAtom, { mode: "promise" });
  const reopen = useAtomSet(reopenPullAtom, { mode: "promise" });
  const merge = useAtomSet(mergePullAtom, { mode: "promise" });
  const close = useAtomSet(closePullAtom, { mode: "promise" });
  const [merging, setMerging] = useState(false);
  const [closing, setClosing] = useState(false);
  const url = pullLink(pull, orgId);
  const params = { orgId, pullId: pull.id };
  const reactivityKeys = pullReactivityKeys(orgId, pull.id);
  const open = pull.state !== "merged" && pull.state !== "closed";
  const run = (request: Promise<unknown>, done: string) =>
    void request
      .then(() => toast.success(done))
      .catch(() => toast.error("GitHub refused"));
  return (
    <>
      <Menu>
        <MenuTrigger
          data-track-owner={track("PullMenu:ResponsiveMenuTrigger.1")}
          render={
            <Button
              data-track-owner={track("PullMenu:Button[Pull request actions]")}
              variant="ghost"
              size="icon-sm"
              aria-label="Pull request actions"
            />
          }
        >
          <DotGrid1x3HorizontalIcon className="size-(--icon-sm)" />
        </MenuTrigger>
        <MenuContent align="end" className="w-56">
          <MenuItem
            data-track-owner={track(
              "PullMenu:ResponsiveMenuItem[Open in GitHub]",
            )}
            onClick={() =>
              window.open(pull.url, "_blank", "noopener,noreferrer")
            }
          >
            <span className={menuIconSlotClassName}>
              <Icon name="github" size="sm" />
            </span>
            Open in GitHub
            <span className={shortcutClassName}>O G</span>
          </MenuItem>
          <MenuSubmenu
            icon={<SquareBehindSquare2Icon className="size-(--icon-sm)" />}
            label="Copy"
            className="w-48"
          >
            <MenuItem
              data-track-owner={track("PullMenu:ResponsiveMenuItem[Copy link]")}
              onClick={() => copyPullLink(pull, url)}
            >
              <span className={menuIconSlotClassName}>
                <ArrowShareRightIcon className="size-(--icon-sm)" />
              </span>
              Copy link
            </MenuItem>
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Copy link to guide]",
              )}
              disabled
              onClick={() =>
                copyPullLink(
                  pull,
                  `${url}&tab=guide`,
                  `${repoName(pull.repo)}#${pull.number} · Guide`,
                )
              }
            >
              <span className={menuIconSlotClassName}>
                <ArrowShareRightIcon className="size-(--icon-sm)" />
              </span>
              Copy link to guide
            </MenuItem>
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Copy GitHub link]",
              )}
              onClick={() =>
                copyText(
                  pull.url,
                  "GitHub link copied",
                  "Could not copy GitHub link",
                )
              }
            >
              <span className={menuIconSlotClassName}>
                <Icon name="github" size="sm" />
              </span>
              Copy GitHub link
            </MenuItem>
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Copy branch name]",
              )}
              onClick={() =>
                copyText(pull.headRef, "Branch copied", "Could not copy branch")
              }
            >
              <span className={menuIconSlotClassName}>
                <BranchIcon className="size-(--icon-sm)" />
              </span>
              Copy branch name
            </MenuItem>
          </MenuSubmenu>
          {onOpenThread !== undefined && threads.length > 0 ? (
            <MenuSubmenu
              icon={<Bubble2Icon className="size-(--icon-sm)" />}
              label="Thread"
              className="w-64"
            >
              <PullThreadMenuItems
                threads={threads}
                onOpenThread={onOpenThread}
                onChatWithCapy={onChatWithCapy}
              />
            </MenuSubmenu>
          ) : (
            onChatWithCapy !== undefined && (
              <MenuItem
                data-track-owner={track(
                  "PullMenu:ResponsiveMenuItem[New thread with PR]",
                )}
                onClick={onChatWithCapy}
              >
                <span className={menuIconSlotClassName}>
                  <Bubble2Icon className="size-(--icon-sm)" />
                </span>
                New thread with PR
              </MenuItem>
            )
          )}
          {pull.state !== "merged" && <MenuSeparator />}
          {pull.state === "draft" && (
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Mark ready for review]",
              )}
              onClick={() =>
                run(
                  setDraft({
                    params,
                    payload: { draft: false },
                    reactivityKeys,
                  }),
                  "Marked ready for review",
                )
              }
            >
              <span className={menuIconSlotClassName}>
                <PullRequestIcon className="size-(--icon-sm)" />
              </span>
              Mark ready for review
            </MenuItem>
          )}
          {open && pull.state !== "draft" && (
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Convert to draft]",
              )}
              onClick={() =>
                run(
                  setDraft({
                    params,
                    payload: { draft: true },
                    reactivityKeys,
                  }),
                  "Converted to draft",
                )
              }
            >
              <span className={menuIconSlotClassName}>
                <DraftIcon className="size-(--icon-sm)" />
              </span>
              Convert to draft
            </MenuItem>
          )}
          {open && (
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Merge pull request]",
              )}
              disabled={pull.state === "draft"}
              onClick={() => setMerging(true)}
            >
              <span className={menuIconSlotClassName}>
                <MergedIcon className="size-(--icon-sm)" />
              </span>
              Merge pull request
            </MenuItem>
          )}
          {open && <MenuSeparator />}
          {pull.state === "closed" ? (
            <MenuItem
              data-track-owner={track(
                "PullMenu:ResponsiveMenuItem[Reopen pull request]",
              )}
              onClick={() =>
                run(reopen({ params, reactivityKeys }), "Reopened")
              }
            >
              <span className={menuIconSlotClassName}>
                <PullRequestIcon className="size-(--icon-sm)" />
              </span>
              Reopen pull request
            </MenuItem>
          ) : (
            pull.state !== "merged" && (
              <MenuItem
                data-track-owner={track(
                  "PullMenu:ResponsiveMenuItem[Close pull request]",
                )}
                intent="danger"
                data-intent="danger"
                onClick={() => setClosing(true)}
              >
                <span className={menuIconSlotClassName}>
                  <CrossMediumIcon className="size-(--icon-sm)" />
                </span>
                Close pull request
              </MenuItem>
            )
          )}
        </MenuContent>
      </Menu>
      <ConfirmPullAction
        open={merging}
        onOpenChange={setMerging}
        title="Squash and merge"
        description={`Merges ${repoName(pull.repo)}#${pull.number} into ${pull.baseRef} and cannot be undone`}
        confirmLabel="Squash and merge"
        onConfirm={() =>
          run(merge({ params, payload: {}, reactivityKeys }), "Merged")
        }
      />
      <ConfirmPullAction
        open={closing}
        onOpenChange={setClosing}
        title="Close pull request"
        description={`Closes ${repoName(pull.repo)}#${pull.number} without merging it`}
        confirmLabel="Close pull request"
        intent="danger"
        onConfirm={() =>
          run(close({ params, payload: {}, reactivityKeys }), "Closed")
        }
      />
    </>
  );
}

function ConfirmPullAction({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  intent = "accent",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  intent?: "accent" | "danger";
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            intent={intent}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PullPanelHeader({
  pull,
  onOpenThread,
  onChatWithCapy,
}: PullMenuProps) {
  const { owner, name } = {
    owner: pull.repo.split("/")[0] ?? "",
    name: repoName(pull.repo),
  };
  return (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <PullStateIcon state={pull.state} />
        <span
          className="min-w-0 truncate text-sm font-medium text-foreground"
          title={pull.title}
        >
          {pull.title}
        </span>
      </span>
      <PullMenu
        pull={pull}
        onOpenThread={onOpenThread}
        onChatWithCapy={onChatWithCapy}
      />
      <Tooltip>
        <TooltipTrigger
          data-track-owner={track("PullPanelHeader:TooltipTrigger.1")}
          render={
            <Button
              data-track-owner={track(
                "PullPanelHeader:Button[Open pull request]",
              )}
              variant="ghost"
              size="icon-sm"
              aria-label="Open pull request"
              render={
                <Link
                  data-track-owner={track("PullPanelHeader:Link.1")}
                  to="/pull/$owner/$repo/$prNumber"
                  params={{ owner, repo: name, prNumber: String(pull.number) }}
                />
              }
            />
          }
        >
          <Icon name="minimize-45" size="sm" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Open pull request</TooltipContent>
      </Tooltip>
    </>
  );
}

function FileTreeRows({
  nodes,
  depth,
}: {
  nodes: ReadonlyArray<FileTreeNode>;
  depth: number;
}) {
  return nodes.map((node) =>
    node.kind === "dir" ? (
      <div key={`d:${node.path}`} className="flex flex-col">
        <div className="flex h-6 items-center gap-1.5 px-2 text-sm text-muted-foreground-2">
          <Icon name="folder-open" size="xs" className="text-icon-muted" />
          <span className="min-w-0 truncate">{node.name}</span>
        </div>
        <div className="ml-3.5 border-l-hairline border-border-1 pl-1.5">
          <FileTreeRows nodes={node.children} depth={depth + 1} />
        </div>
      </div>
    ) : (
      <div
        key={`f:${node.file.path}`}
        className="flex h-6 items-center gap-1.5 rounded px-2 text-sm text-foreground hover:bg-secondary"
      >
        <Icon name="file-text" size="xs" className="text-icon-muted" />
        <span
          className={cx(
            "min-w-0 flex-1 truncate",
            node.file.status === "added" && "text-diff-add",
          )}
        >
          {node.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums">
          {node.file.additions > 0 && (
            <span className="text-diff-add">+{node.file.additions}</span>
          )}
          {node.file.deletions > 0 && (
            <span className="ml-1 text-diff-del">-{node.file.deletions}</span>
          )}
        </span>
        {node.file.status === "added" && (
          <span className="shrink-0 text-xs text-diff-add">A</span>
        )}
      </div>
    ),
  );
}

export function PullRail({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const [query, setQuery] = useState("");
  const [reviewOpen, setReviewOpen] = useState(true);
  const diff = resultValue(useAtomValue(pullDiffAtom(orgId, pull.id)));
  useAtomValue(pullReviewAtom(orgId, pull.id));
  const files = diff === undefined ? [] : toDiffFiles(diff);
  const visible = filterFiles(files, query);
  return (
    <div className="flex min-h-0 w-full flex-col gap-6 overflow-y-auto px-4 pt-3 pb-4">
      <div data-pull-section="review" className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Button
            data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:Button.1"
            variant="ghost"
            size="xs"
            className="-ml-2"
            onClick={() => setReviewOpen((value) => !value)}
          >
            <span className="text-muted-foreground-2">Capy Review</span>
            {reviewOpen ? (
              <ChevronDownSmallIcon className="size-(--icon-sm) text-icon-muted" />
            ) : (
              <ChevronRightSmallIcon className="size-(--icon-sm) text-icon-muted" />
            )}
          </Button>
          <span className="min-w-0 flex-1" />
          <Bubble2Icon className="size-(--icon-sm) text-icon-muted" />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground-2">Files</span>
          <span className="text-muted-foreground-3">{files.length}</span>
        </div>
        <label className="flex h-(--h-control-sm) items-center gap-2 rounded border-hairline border-border-2 bg-input px-2 text-sm">
          <Icon name="search-menu" size="xs" className="text-icon-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
            placeholder="Filter files"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="flex flex-col">
          <FileTreeRows nodes={buildFileTree(visible)} depth={0} />
        </div>
      </div>
    </div>
  );
}

function TabPlaceholder({ line }: { line: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground-2">
      {line}
    </div>
  );
}

export type PullViewProps = {
  pull: Pull;
  host: "page" | "panel" | "pane";
  tab?: PullTab;
  onTabChange?: (tab: PullTab) => void;
  onOpenThread?: (jamId: string) => void;
  onChatWithCapy?: () => void;
};

export function PullView({
  pull,
  host,
  tab,
  onTabChange,
  onOpenThread,
  onChatWithCapy,
}: PullViewProps) {
  const [localTab, setLocalTab] = useState<PullTab>(tab ?? "overview");
  const current = tab ?? localTab;
  const select = (next: PullTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  return (
    <div className="@container/pull flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 shrink-0 items-center gap-1.5 px-3 @max-lg/pull:gap-1 @max-sm/pull:gap-0.5">
        <PullViewTab
          data-track-owner={track("PullView:PullViewTab[Overview]")}
          command="pullTab.overview"
          label="Overview"
          className="@max-sm/pull:px-2"
          active={current === "overview"}
          onClick={() => select("overview")}
        />
        <PullViewTab
          command="pullTab.guide"
          data-track="guided_review.start"
          label="Guide"
          className="@max-sm/pull:px-2"
          active={current === "guide"}
          onClick={() => select("guide")}
        />
        <PullViewTab
          data-track-owner={track("PullView:PullViewTab[Diff]")}
          command="pullTab.diff"
          label="Diff"
          className="@max-sm/pull:px-2"
          active={current === "diff"}
          onClick={() => select("diff")}
        />
        <span className="min-w-0 flex-1" />
        {host === "page" && onOpenThread !== undefined && (
          <ChatWithCapyButton
            data-track-owner={track("PullView:ChatWithCapyButton.1")}
            pull={pull}
            onOpenThread={onOpenThread}
            onChatWithCapy={onChatWithCapy}
            foldEarly={current === "guide"}
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {current === "overview" ? (
            <ScrollArea className="min-h-0 flex-1">
              <ScrollAreaViewport className="h-full">
                <OverviewTab
                  data-track-owner={track("PullView:OverviewTab.1")}
                  pull={pull}
                  onOpenThread={onOpenThread}
                  onChatWithCapy={onChatWithCapy}
                  railHosted={host === "page"}
                />
              </ScrollAreaViewport>
            </ScrollArea>
          ) : (
            <TabPlaceholder line={current === "guide" ? "Guide" : "Diff"} />
          )}
        </div>
        {host === "page" && current !== "guide" && (
          <div className="hidden w-76 shrink-0 @5xl/pull:flex">
            <PullRail pull={pull} />
          </div>
        )}
      </div>
    </div>
  );
}
