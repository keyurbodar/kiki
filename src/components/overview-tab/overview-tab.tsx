import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity } from "@/components/activity";
import { Avatar, cx } from "@/components/activity-card";
import { WriteBox } from "@/components/github-write";
import {
  closePullAtom,
  editBodyAtom,
  pullChecksAtom,
  pullLabelsAtom,
  pullReactivityKeys,
  pullReviewersAtom,
  pullThreadsAtom,
  reopenPullAtom,
  setDraftAtom,
  setLabelAtom,
  setReviewerAtom,
  unlinkThreadAtom,
} from "@/components/pull-view/atoms";
import { copyText } from "@/components/pull-view/clipboard";
import { usePullOrgId } from "@/components/pull-view/context";
import {
  ArrowUpRightIcon,
  BranchSimpleIcon,
  Bubble2Icon,
  Checkmark1Icon,
  ChevronDownSmallIcon,
  ChevronRightSmallIcon,
  CircleDashedIcon,
  CrossMediumIcon,
  MinusSmallIcon,
  PlusLargeIcon,
  PullRequestIcon,
  TagIcon,
  UserIcon,
} from "@/components/pull-view/icons";
import { PullMarkdown } from "@/components/pull-view/markdown";
import {
  type CheckRow,
  type CheckVerdict,
  checkStatusWord,
  checksSummary,
  checkVerdict,
  type Pull,
  type PullLabel,
  type PullReviewer,
  relativeTime,
  rollupVerdict,
  sortChecks,
  toCheckRows,
  toLabels,
  toReviewers,
  toThreadRefs,
} from "@/components/pull-view/pull-model";
import { DiffStat, PullStateIcon } from "@/components/pull-view/pull-parts";
import { resultValue } from "@/components/pull-view/result";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSearchRow,
  MenuTrigger,
} from "@/primitives/menu";

const track = (owner: string) => `shared/pull-view/overview-tab.tsx#${owner}`;

export const propertyValueClassName = cx(
  "-mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium text-foreground",
  "outline-none select-none transition-colors duration-100 hover:bg-secondary data-[popup-open]:bg-secondary",
  "focus-visible:outline-ring-inset",
);

export const propertyIconSlotClassName =
  "flex size-(--icon-xs) shrink-0 items-center justify-center";

const menuSearchInputClassName =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

const menuGroupLabelClassName =
  "mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

const scrollToSection = (section: string) => {
  for (const element of document.querySelectorAll(
    `[data-pull-section="${section}"]`,
  )) {
    if (element instanceof HTMLElement && element.offsetParent !== null) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
};

export type PropertyRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

export function PropertyRow({ icon, label, children }: PropertyRowProps) {
  return (
    <div className="flex min-h-7 items-start gap-2 py-0.5">
      <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 pointer-coarse:w-28 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
        {icon}
        {label}
      </span>
      <div className="flex min-h-6 min-w-0 flex-1 items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function BranchName({ branch }: { branch: string }) {
  return (
    <button
      data-track-owner={track("BranchName:button.1")}
      type="button"
      aria-label={`Copy branch ${branch}`}
      onClick={() =>
        copyText(branch, "Branch copied", "Could not copy branch", branch)
      }
      className={cx(
        "focus-gutter scrollbar-hide min-w-0 overflow-x-auto rounded whitespace-nowrap text-ellipsis outline-none hover:underline md:scroll-fade-x md:text-clip",
        "focus-visible:outline-ring-inset",
      )}
    >
      {branch}
    </button>
  );
}

const statusLabels = {
  draft: "Draft",
  ready: "Ready for review",
  closed: "Closed",
} as const;

type StatusChoice = keyof typeof statusLabels;

export function StatusControl({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const setDraft = useAtomSet(setDraftAtom, { mode: "promise" });
  const close = useAtomSet(closePullAtom, { mode: "promise" });
  const reopen = useAtomSet(reopenPullAtom, { mode: "promise" });
  if (pull.state === "merged") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
        <span className={propertyIconSlotClassName}>
          <PullStateIcon state="merged" />
        </span>
        Merged
      </span>
    );
  }
  const current: StatusChoice =
    pull.state === "draft"
      ? "draft"
      : pull.state === "closed"
        ? "closed"
        : "ready";
  const params = { orgId, pullId: pull.id };
  const reactivityKeys = pullReactivityKeys(orgId, pull.id);
  const choose = (next: StatusChoice) => {
    if (next === current) return;
    const request =
      next === "closed"
        ? close({ params, payload: {}, reactivityKeys })
        : current === "closed"
          ? reopen({ params, reactivityKeys })
          : setDraft({
              params,
              payload: { draft: next === "draft" },
              reactivityKeys,
            });
    request.catch(() => toast.error("GitHub refused"));
  };
  const check = (choice: StatusChoice) =>
    current === choice && (
      <Checkmark1Icon className="ml-auto size-(--icon-sm) shrink-0 text-foreground" />
    );
  return (
    <Menu>
      <MenuTrigger
        data-track-owner={track("StatusControl:MenuTrigger.1")}
        render={
          <button
            data-track-owner={track("StatusControl:button.1")}
            type="button"
            className={propertyValueClassName}
          />
        }
      >
        <span className={propertyIconSlotClassName}>
          <PullStateIcon state={pull.state} />
        </span>
        {statusLabels[current]}
        <ChevronDownSmallIcon className="size-(--icon-xs) text-icon-muted" />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem
          data-track-owner={track("StatusControl:MenuItem[Draft]")}
          disabled={current === "closed"}
          onClick={() => choose("draft")}
        >
          Draft{check("draft")}
        </MenuItem>
        <MenuItem
          data-track-owner={track("StatusControl:MenuItem[Ready for review]")}
          onClick={() => choose("ready")}
        >
          Ready for review{check("ready")}
        </MenuItem>
        <MenuItem
          data-track-owner={track("StatusControl:MenuItem[Closed]")}
          onClick={() => choose("closed")}
        >
          Closed{check("closed")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function AddValue({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={propertyIconSlotClassName}>
        <PlusLargeIcon className="size-3" />
      </span>
      {label}
    </span>
  );
}

const reviewWords: Readonly<Record<string, string>> = {
  approved: "Approved",
  changes_requested: "Requested changes",
  commented: "Commented",
  dismissed: "Dismissed",
};

export function ReviewersControl({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const setReviewer = useAtomSet(setReviewerAtom, { mode: "promise" });
  const reviewers = toReviewers(
    resultValue(useAtomValue(pullReviewersAtom(orgId, pull.id))) ?? [],
  );
  const shown = reviewers.slice(0, 6);
  const matching = reviewers.filter((reviewer) =>
    `${reviewer.login} ${reviewer.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const toggle = (reviewer: PullReviewer, requested: boolean) => {
    setBusy(reviewer.login);
    setReviewer({
      params: { orgId, pullId: pull.id },
      payload: { login: reviewer.login, requested },
      reactivityKeys: pullReactivityKeys(orgId, pull.id),
    })
      .catch(() => toast.error("GitHub refused"))
      .finally(() => setBusy(null));
  };
  return (
    <Menu>
      <MenuTrigger
        data-track-owner="shared/pull-view/reviewers-menu.tsx#ReviewersControl:ResponsiveMenuTrigger.1"
        render={
          <button
            data-track-owner="shared/pull-view/reviewers-menu.tsx#ReviewersControl:button.1"
            type="button"
            className={cx(propertyValueClassName, "max-w-full min-w-0")}
          />
        }
      >
        {shown.length === 0 ? (
          <AddValue label="Add reviewers" />
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex shrink-0 -space-x-1">
              {shown.map((reviewer) => (
                <Avatar
                  key={reviewer.login}
                  size="xs"
                  name={reviewer.login}
                  src={reviewer.avatarUrl}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {shown.map((reviewer) => reviewer.login).join(", ")}
            </span>
          </span>
        )}
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        <MenuSearchRow>
          <input
            className={menuSearchInputClassName}
            placeholder="Search reviewers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </MenuSearchRow>
        {matching.length > 0 && (
          <div>
            <MenuLabel className={menuGroupLabelClassName}>Reviewers</MenuLabel>
            {matching.map((reviewer) => (
              <MenuCheckboxItem
                key={reviewer.login}
                data-track-owner="shared/pull-view/reviewers-menu.tsx#ReviewersControl:ResponsiveMenuCheckboxItem.1"
                checked
                disabled={busy === reviewer.login}
                onCheckedChange={(checked) => toggle(reviewer, checked)}
              >
                <Avatar
                  size="xs"
                  name={reviewer.login}
                  src={reviewer.avatarUrl}
                />
                <span className="min-w-0 flex-1 truncate">
                  {reviewer.name === null ? (
                    reviewer.login
                  ) : (
                    <>
                      {reviewer.name}
                      <span className="ml-1.5 text-muted-foreground-2">
                        {reviewer.login}
                      </span>
                    </>
                  )}
                </span>
                {reviewer.state !== null &&
                  reviewWords[reviewer.state] !== undefined && (
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
                      {reviewWords[reviewer.state]}
                    </span>
                  )}
              </MenuCheckboxItem>
            ))}
          </div>
        )}
        {matching.length === 0 && (
          <span className="flex h-(--h-menu-row) items-center px-2 text-sm text-muted-foreground-2">
            No matching reviewers
          </span>
        )}
      </MenuContent>
    </Menu>
  );
}

function LabelDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-full bg-(--label-color)"
      style={{ ["--label-color" as string]: color === "" ? undefined : color }}
    />
  );
}

export function LabelsControl({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const setLabel = useAtomSet(setLabelAtom, { mode: "promise" });
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
        data-track-owner="shared/pull-view/labels-menu.tsx#LabelsControl:ResponsiveMenuTrigger.1"
        nativeButton={false}
        render={
          <div
            className={cx(
              propertyValueClassName,
              "h-auto min-h-6 max-w-full flex-wrap gap-x-3 gap-y-1 py-1",
            )}
          />
        }
      >
        {pull.labels.length === 0 ? (
          <AddValue label="Add labels" />
        ) : (
          pull.labels.map((label) => (
            <span
              key={label.name}
              className="flex max-w-full min-w-0 items-center gap-1"
            >
              <span className={propertyIconSlotClassName}>
                <LabelDot color={label.color} />
              </span>
              <span className="truncate">{label.name}</span>
            </span>
          ))
        )}
      </MenuTrigger>
      <MenuContent align="start" className="w-80">
        <MenuSearchRow>
          <input
            className={menuSearchInputClassName}
            placeholder="Search labels"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </MenuSearchRow>
        {open && (
          <LabelOptions
            pull={pull}
            query={query}
            busy={busy}
            onToggle={(label, applied) => {
              setBusy(label.name);
              setLabel({
                params: { orgId, pullId: pull.id },
                payload: { name: label.name, applied },
                reactivityKeys: pullReactivityKeys(orgId, pull.id),
              })
                .catch(() => toast.error("GitHub refused"))
                .finally(() => setBusy(null));
            }}
          />
        )}
      </MenuContent>
    </Menu>
  );
}

function LabelOptions({
  pull,
  query,
  busy,
  onToggle,
}: {
  pull: Pull;
  query: string;
  busy: string | null;
  onToggle: (label: PullLabel, applied: boolean) => void;
}) {
  const orgId = usePullOrgId();
  const result = resultValue(useAtomValue(pullLabelsAtom(orgId, pull.id)));
  const labels = (result === undefined ? pull.labels : toLabels(result)).filter(
    (label) => label.name.toLowerCase().includes(query.toLowerCase()),
  );
  if (labels.length === 0) {
    return (
      <span className="flex h-(--h-menu-row) items-center px-2 text-sm text-muted-foreground-2">
        No matching labels
      </span>
    );
  }
  return labels.map((label) => {
    const applied = pull.labels.some((entry) => entry.name === label.name);
    return (
      <MenuCheckboxItem
        key={label.name}
        data-track-owner="shared/pull-view/labels-menu.tsx#LabelsControl:ResponsiveMenuCheckboxItem.1"
        checked={applied}
        disabled={busy === label.name}
        onCheckedChange={(checked) => busy === null && onToggle(label, checked)}
      >
        <LabelDot color={label.color} />
        <span className="min-w-0 flex-1 truncate">{label.name}</span>
      </MenuCheckboxItem>
    );
  });
}

const verdictIcon = (verdict: CheckVerdict) => {
  switch (verdict) {
    case "failure":
      return <CrossMediumIcon className="size-(--icon-xs) text-destructive" />;
    case "pending":
      return <CircleDashedIcon className="size-(--icon-xs) text-warning-fg" />;
    case "neutral":
      return (
        <MinusSmallIcon className="size-(--icon-xs) text-muted-foreground-3" />
      );
    case "success":
      return <Checkmark1Icon className="size-(--icon-xs) text-success" />;
  }
};

export function ChecksRollup({ checks }: { checks: ReadonlyArray<CheckRow> }) {
  return (
    <span className={propertyIconSlotClassName}>
      {verdictIcon(rollupVerdict(checks))}
    </span>
  );
}

export function CheckRows({
  checks,
  className,
}: {
  checks: ReadonlyArray<CheckRow>;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col", className)}>
      {sortChecks(checks).map((check) => {
        const content = (
          <>
            {verdictIcon(checkVerdict(check))}
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">
              {check.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground-2">
              {checkStatusWord(check)}
            </span>
            {check.detailsUrl !== null && (
              <ArrowUpRightIcon className="size-(--icon-xs) shrink-0 text-icon-muted" />
            )}
          </>
        );
        const key = `${check.kind}:${check.name}`;
        return check.detailsUrl === null ? (
          <span
            key={key}
            className="flex h-7 items-center gap-2 rounded px-2 transition-colors duration-100"
          >
            {content}
          </span>
        ) : (
          <a
            key={key}
            data-track-owner="shared/pull-view/checks-rows.tsx#CheckRows:a.1"
            href={check.detailsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "flex h-7 items-center gap-2 rounded px-2 transition-colors duration-100",
              "outline-none select-none hover:bg-secondary",
              "focus-visible:outline-ring-inset",
            )}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}

export function ChecksSection({
  checkRows,
}: {
  checkRows: ReadonlyArray<CheckRow>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div data-pull-section="checks" className="flex scroll-mt-3 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button
          data-track-owner="shared/pull-view/checks-rows.tsx#ChecksSection:Button.1"
          variant="ghost"
          size="xs"
          className="-ml-2"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-muted-foreground-2">Checks</span>
          {open ? (
            <ChevronDownSmallIcon className="size-(--icon-sm) text-icon-muted" />
          ) : (
            <ChevronRightSmallIcon className="size-(--icon-sm) text-icon-muted" />
          )}
        </Button>
        {!open && (
          <span className="ml-auto min-w-0 truncate text-xs text-muted-foreground-3">
            {checksSummary(checkRows)}
          </span>
        )}
      </div>
      {open && <CheckRows checks={checkRows} className="-mx-2" />}
    </div>
  );
}

export function ThreadValueRow({
  jamId,
  title,
  onOpen,
  onUnlink,
}: {
  jamId: string;
  title: string | null;
  onOpen?: (jamId: string) => void;
  onUnlink?: () => void;
}) {
  const link = (
    <Link
      data-track-owner={track("ThreadValueRow:Link.1")}
      to="/thread/$threadId"
      params={{ threadId: jamId }}
      className={cx(propertyValueClassName, "max-w-full min-w-0")}
      onClick={(event) => {
        if (onOpen === undefined) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        onOpen(jamId);
      }}
    >
      <span className={propertyIconSlotClassName}>
        <Icon
          name="studio-display"
          className="size-(--icon-xs) text-icon-muted"
        />
      </span>
      <span className="min-w-0 truncate">{title ?? "Untitled thread"}</span>
    </Link>
  );
  if (onUnlink === undefined) return link;
  return (
    <span className="group/thread flex max-w-full min-w-0 items-center gap-1">
      {link}
      <Button
        data-track-owner={track("ThreadValueRow:Button[Unlink thread]")}
        variant="bare"
        size="icon-shrink"
        aria-label="Unlink thread"
        title="Unlink thread"
        onClick={onUnlink}
        className="opacity-0 group-hover/thread:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
      >
        <CrossMediumIcon className="size-(--icon-xs)" />
      </Button>
    </span>
  );
}

export function ThreadsControl({
  pull,
  onOpenThread,
  onChatWithCapy,
  unlinkable = false,
}: {
  pull: Pull;
  onOpenThread?: (jamId: string) => void;
  onChatWithCapy?: () => void;
  unlinkable?: boolean;
}) {
  const orgId = usePullOrgId();
  const unlink = useAtomSet(unlinkThreadAtom, { mode: "promise" });
  const result = resultValue(useAtomValue(pullThreadsAtom(orgId, pull.id)));
  const threads =
    result === undefined
      ? pull.threadId === null
        ? []
        : [{ id: pull.threadId, title: null }]
      : toThreadRefs(result);
  if (threads.length === 0 && result === undefined) return null;
  if (threads.length === 0) {
    return onChatWithCapy === undefined ? (
      <span className="flex items-center gap-1 text-xs text-muted-foreground-2">
        Not opened by Capy
      </span>
    ) : (
      <button
        data-track-owner={track("ThreadsControl:button[New thread with PR]")}
        type="button"
        className={cx(
          propertyValueClassName,
          "text-muted-foreground-2 hover:text-foreground",
        )}
        onClick={onChatWithCapy}
      >
        <span className={propertyIconSlotClassName}>
          <PlusLargeIcon className="size-3" />
        </span>
        New thread with PR
      </button>
    );
  }
  return (
    <span className="flex w-full min-w-0 flex-col items-start gap-0.5">
      {threads.map((thread) => (
        <ThreadValueRow
          key={thread.id}
          jamId={thread.id}
          title={thread.title}
          onOpen={onOpenThread}
          onUnlink={
            !unlinkable || thread.id === pull.threadId
              ? undefined
              : () =>
                  void unlink({
                    params: { orgId, pullId: pull.id, jamId: thread.id },
                    reactivityKeys: pullReactivityKeys(orgId, pull.id),
                  }).catch(() => undefined)
          }
        />
      ))}
    </span>
  );
}

export function IssuesRow({ pull }: { pull: Pull }) {
  const issues = pull.issues;
  return (
    <PropertyRow
      icon={<CircleDashedIcon />}
      label={issues.length > 1 ? "Issues" : "Issue"}
    >
      {issues.length === 0 ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground-2">
          No issues
        </span>
      ) : (
        <span className="flex w-full min-w-0 flex-col items-start gap-0.5">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              data-track-owner="shared/issues/pull-issues-row.tsx#PullIssuesRow:Link.1"
              to="/issues/$code"
              params={{ code: issue.code }}
              className={cx(propertyValueClassName, "max-w-full min-w-0")}
            >
              <span className={propertyIconSlotClassName}>
                <CircleDashedIcon className="size-(--icon-xs) text-icon-muted" />
              </span>
              <span className="shrink-0 font-normal text-muted-foreground-2">
                {issue.code}
              </span>
              <span className="min-w-0 truncate">{issue.title}</span>
            </Link>
          ))}
        </span>
      )}
    </PropertyRow>
  );
}

export type PropertyRowsProps = {
  pull: Pull;
  checkRows: ReadonlyArray<CheckRow>;
  onOpenThread?: (jamId: string) => void;
  onChatWithCapy?: () => void;
  unlinkable?: boolean;
};

export function PropertyRows({
  pull,
  checkRows,
  onOpenThread,
  onChatWithCapy,
  unlinkable,
}: PropertyRowsProps) {
  const orgId = usePullOrgId();
  const threads = resultValue(useAtomValue(pullThreadsAtom(orgId, pull.id)));
  const threadCount = threads === undefined ? 0 : toThreadRefs(threads).length;
  return (
    <div className="flex flex-col gap-1">
      <PropertyRow icon={<BranchSimpleIcon />} label="Branch">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs text-foreground">
          <span className="flex h-6 max-w-full min-w-0 items-center gap-1">
            <BranchName branch={pull.headRef} />
          </span>
          <span className="flex h-6 max-w-full min-w-0 items-center gap-1">
            <ChevronRightSmallIcon className="size-(--icon-xs) shrink-0 text-icon-muted" />
            <BranchName branch={pull.baseRef} />
            <span className="ml-1">
              <DiffStat
                additions={pull.additions}
                deletions={pull.deletions}
                diffBreakdown={pull.diffBreakdown}
              />
            </span>
          </span>
        </span>
      </PropertyRow>
      <PropertyRow icon={<PullRequestIcon />} label="Status">
        <StatusControl pull={pull} />
      </PropertyRow>
      <PropertyRow icon={<UserIcon />} label="Reviewers">
        <ReviewersControl pull={pull} />
      </PropertyRow>
      <PropertyRow icon={<TagIcon />} label="Labels">
        <LabelsControl pull={pull} />
      </PropertyRow>
      <PropertyRow icon={<Icon name="circle-check" />} label="Checks">
        {checkRows.length === 0 ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground-2">
            No checks yet
          </span>
        ) : (
          <button
            data-track-owner={track("PropertyRows:button.1")}
            type="button"
            className={propertyValueClassName}
            onClick={() => scrollToSection("checks")}
          >
            <ChecksRollup checks={checkRows} />
            {checksSummary(checkRows)}
          </button>
        )}
      </PropertyRow>
      <PropertyRow
        icon={<Bubble2Icon />}
        label={threadCount > 1 ? "Threads" : "Thread"}
      >
        <ThreadsControl
          pull={pull}
          onOpenThread={onOpenThread}
          onChatWithCapy={onChatWithCapy}
          unlinkable={unlinkable}
        />
      </PropertyRow>
      <IssuesRow pull={pull} />
    </div>
  );
}

export function Description({ pull }: { pull: Pull }) {
  const orgId = usePullOrgId();
  const editBody = useAtomSet(editBodyAtom, { mode: "promise" });
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const body = (pull.bodyMd ?? "").trim();
  const save = (text: string) => {
    setSaving(true);
    editBody({
      params: { orgId, pullId: pull.id },
      payload: { body: text },
      reactivityKeys: pullReactivityKeys(orgId, pull.id),
    })
      .then(() => setEditing(false))
      .catch(() => toast.error("GitHub refused"))
      .finally(() => setSaving(false));
  };
  return (
    <div className="group/description flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Button
          data-track-owner={track("Description:Button.1")}
          variant="ghost"
          size="xs"
          className="-ml-2 w-fit"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-muted-foreground-2">Description</span>
          {open ? (
            <ChevronDownSmallIcon className="size-(--icon-sm) text-icon-muted" />
          ) : (
            <ChevronRightSmallIcon className="size-(--icon-sm) text-icon-muted" />
          )}
        </Button>
        <span className="min-w-0 flex-1" />
        {!editing && (
          <Button
            data-track-owner={track("Description:Button[Edit description]")}
            variant="ghost"
            size="icon-xs"
            aria-label="Edit description"
            className="opacity-0 transition-opacity duration-100 group-hover/description:opacity-100 focus-visible:opacity-100"
            onClick={() => {
              setOpen(true);
              setEditing(true);
            }}
          >
            <Icon name="pencil" size="sm" />
          </Button>
        )}
      </div>
      {open &&
        (editing ? (
          <div className="flex flex-col gap-1.5">
            <WriteBox
              placeholder="Describe this pull request"
              submitLabel="Save"
              defaultValue={pull.bodyMd ?? ""}
              clearOnSubmit={false}
              disabled={saving}
              submitLocked={saving}
              autoFocus
              onSubmit={save}
              leftControls={
                <Button variant="ghost" size="icon-sm" aria-label="Attach">
                  <PlusLargeIcon className="size-(--icon-sm)" />
                </Button>
              }
            />
            <Button
              data-track-owner={track("Description:Button[Cancel]")}
              variant="ghost"
              size="xs"
              className="w-fit self-end"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        ) : body === "" ? (
          <span className="px-0.5 text-sm text-muted-foreground-2">
            No description
          </span>
        ) : (
          <div data-quote-source={`${pull.repo}#${pull.number} description`}>
            <PullMarkdown text={body} className="px-0.5" />
          </div>
        ))}
    </div>
  );
}

const metaSegmentClassName = "relative flex shrink-0 items-center gap-1.5 pl-4";

function MetaDivider() {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 left-2 h-3 w-hairline -translate-y-1/2 bg-border-1"
    />
  );
}

export function PullHeading({ pull }: { pull: Pull }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-medium text-balance text-foreground">
        {pull.title}
      </h1>
      <div className="overflow-hidden">
        <div className="-ml-4 flex min-w-0 flex-wrap items-center gap-y-1 text-xs text-muted-foreground-2">
          <span className={metaSegmentClassName}>
            <MetaDivider />
            <Avatar size="xs" name={pull.author} src={pull.authorAvatarUrl} />
            <span className="max-w-48 truncate text-foreground">
              {pull.author}
            </span>
          </span>
          <span className={metaSegmentClassName}>
            <MetaDivider />
            <span
              className="tabular-nums"
              title={`${pull.repo}#${pull.number}`}
            >
              #{pull.number}
            </span>
          </span>
          <span className={metaSegmentClassName}>
            <MetaDivider />
            <span>{relativeTime(pull.createdAt)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export type OverviewTabProps = {
  pull: Pull;
  onOpenThread?: (jamId: string) => void;
  onChatWithCapy?: () => void;
  railHosted?: boolean;
};

export function OverviewTab({
  pull,
  onOpenThread,
  onChatWithCapy,
  railHosted = false,
}: OverviewTabProps) {
  const orgId = usePullOrgId();
  const containerRef = useRef<HTMLDivElement>(null);
  const checkRows = toCheckRows(
    resultValue(useAtomValue(pullChecksAtom(orgId, pull.id))) ?? [],
  );
  return (
    <div
      ref={containerRef}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-4"
    >
      <PullHeading pull={pull} />
      <PropertyRows
        pull={pull}
        checkRows={checkRows}
        onOpenThread={onOpenThread}
        onChatWithCapy={onChatWithCapy}
        unlinkable={railHosted && onOpenThread !== undefined}
      />
      <Description pull={pull} />
      {checkRows.length > 0 && <ChecksSection checkRows={checkRows} />}
      <Activity pull={pull} />
    </div>
  );
}
