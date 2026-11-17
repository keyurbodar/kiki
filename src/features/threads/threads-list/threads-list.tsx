import { Link } from "@tanstack/react-router";
import { type DragEvent, type ReactNode, useState } from "react";
import { ChatIdentity } from "@/features/captains/chat-identity";
import { Badge } from "@/primitives/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { MenuItem, MenuSeparator } from "@/primitives/menu";
import {
  formatAge,
  type ProjectSummary,
  sectionStartsOpen,
  type ThreadListItem,
  type ThreadSection,
  threadCode,
} from "../threads-page/model";

const cx = (...parts: ReadonlyArray<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const leadSlot = "w-4 shrink-0";

const skeletonSections = [
  { header: "w-12", rows: ["w-2/5", "w-1/4"] },
  { header: "w-20", rows: ["w-1/3", "w-1/2", "w-1/5", "w-2/5"] },
  { header: "w-24", rows: ["w-1/4", "w-2/5", "w-1/3"] },
];

/** Loading placeholder: three sections of grey bars, as Capy draws it. */
export function ThreadsListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading threads"
      data-slot="skeleton-panel"
      className="flex flex-col px-2 pt-1"
    >
      {skeletonSections.map((section, index) => (
        <div
          key={section.header}
          className={cx("flex flex-col", index > 0 && "mt-1")}
        >
          <div className="flex h-9 items-center gap-2 rounded-(--radius-card) bg-section px-2">
            <span className={cx(leadSlot, "flex items-center justify-center")}>
              <span className="size-3 rounded bg-secondary" />
            </span>
            <span className={cx("h-3 rounded bg-secondary", section.header)} />
            <span className="h-3 w-3 rounded bg-secondary" />
          </div>
          {section.rows.map((width, row) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
              key={row}
              className="flex h-11 items-center gap-2 rounded px-2"
            >
              <span
                className={cx(leadSlot, "flex items-center justify-center")}
              >
                <span className="size-4 rounded bg-secondary" />
              </span>
              <span className="h-3 w-14 shrink-0 rounded bg-secondary" />
              <span className={cx("h-3 rounded bg-secondary", width)} />
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className="h-5 w-16 rounded bg-secondary" />
                <span className="h-3 w-6 rounded bg-secondary" />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export type ThreadRowProps = {
  thread: ThreadListItem;
  projects: ReadonlyMap<string, ProjectSummary>;
  modelName: (id: string) => string | undefined;
  groupedByProject: boolean;
  now: number;
  checked: boolean;
  selectionMode: boolean;
  onCheck: (id: string) => void;
  onArchive?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  icons?: ThreadsListIcons;
};

export type ThreadsListIcons = {
  readonly chevron?: ReactNode;
  readonly check?: ReactNode;
  readonly archived?: ReactNode;
  readonly person?: ReactNode;
  readonly automation?: ReactNode;
  readonly folder?: ReactNode;
};

export function ThreadRow({
  thread,
  projects,
  modelName,
  groupedByProject,
  now,
  checked,
  selectionMode,
  onCheck,
  onArchive,
  onRename,
  icons,
}: ThreadRowProps) {
  const title = thread.title ?? "Untitled thread";
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  const dragStart = (event: DragEvent<HTMLAnchorElement>) => {
    event.dataTransfer.setData("text/x-kiki-thread", thread.id);
    event.dataTransfer.effectAllowed = "move";
  };
  const project =
    thread.projectId === null ? undefined : projects.get(thread.projectId);
  const model =
    thread.lastModelId === null ? undefined : modelName(thread.lastModelId);
  return (
    <div className="group/row relative block">
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <Link
              to="/thread/$threadId"
              params={{ threadId: thread.id }}
              data-thread-row={thread.id}
              draggable
              onDragStart={dragStart}
              className={cx(
                "flex h-11 items-center gap-2 rounded px-2 outline-none select-none [-webkit-touch-callout:none]",
                "transition-colors duration-100 hover:bg-section data-[selected]:bg-section",
                "focus-visible:outline-ring-inset",
              )}
            >
              <button
                type="button"
                aria-label={checked ? "Deselect thread" : "Select thread"}
                aria-pressed={checked}
                className={cx(
                  leadSlot,
                  "flex cursor-pointer items-center justify-center outline-none",
                  "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100",
                  "pointer-coarse:hidden",
                  (checked || selectionMode) &&
                    "opacity-100 pointer-coarse:flex",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCheck(thread.id);
                }}
              >
                <span
                  data-slot="checkbox"
                  data-checked={checked ? "" : undefined}
                  className="flex size-3.5 items-center justify-center rounded-xs border-hairline border-border-3 bg-input data-[checked]:bg-primary data-[checked]:text-primary-foreground"
                >
                  {checked ? icons?.check : null}
                </span>
              </button>
              <span
                className={cx(leadSlot, "flex items-center justify-center")}
              >
                {thread.captain !== null ? (
                  <ChatIdentity
                    name={thread.captain.name}
                    avatarUrl={thread.captain.avatarUrl}
                  />
                ) : thread.archived ? (
                  icons?.archived
                ) : null}
              </span>
              <span className="@max-lg/list:hidden w-(--thread-code-width) shrink-0 text-sm font-normal whitespace-nowrap text-muted-foreground-2 tabular-nums">
                {threadCode(thread, projects)}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cx(
                    "mask-fade-r min-w-0 overflow-hidden text-sm whitespace-nowrap",
                    thread.hasUnreads
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground-1",
                  )}
                >
                  {title}
                </span>
                {thread.personal && thread.captain === null ? (
                  <span className="text-muted-foreground-2">
                    {icons?.person}
                  </span>
                ) : null}
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 @lg/list:flex">
                {thread.archived && thread.archivedIdleDays !== null ? (
                  <Badge
                    size="base"
                    title={
                      "Archived automatically after " +
                      thread.archivedIdleDays +
                      " days with no activity"
                    }
                  >
                    {icons?.archived}
                    Auto-archived
                  </Badge>
                ) : null}
                {thread.automationName !== null && !thread.archived ? (
                  <Badge
                    size="base"
                    className="max-w-48"
                    title={thread.automationName + " runs in this thread"}
                  >
                    {icons?.automation}
                    <span className="min-w-0 truncate">
                      {thread.automationName}
                    </span>
                  </Badge>
                ) : null}
                {project !== undefined && !groupedByProject ? (
                  <Badge size="base" className="@max-4xl/list:hidden">
                    {project.name}
                  </Badge>
                ) : null}
                {model === undefined ? null : (
                  <Badge size="base" className="@max-2xl/list:hidden">
                    {model}
                  </Badge>
                )}
              </span>
              <span className="w-14 shrink-0 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
                {formatAge(thread.sortActivityAt, { now, minified: true })}
              </span>
            </Link>
          }
        />
        <ContextMenuContent>
          <MenuItem
            onClick={() => {
              setDraft(thread.title ?? "");
              setRenaming(true);
            }}
          >
            Rename
          </MenuItem>
          <MenuItem onClick={() => onArchive?.(thread.id)}>
            {thread.archived ? "Unarchive" : "Archive"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => onCheck(thread.id)}>
            {checked ? "Deselect" : "Select thread"}
          </MenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {renaming ? (
        <form
          className="absolute inset-x-0 top-0 z-(--z-overlay-content)"
          onSubmit={(event) => {
            event.preventDefault();
            onRename?.(thread.id, draft.trim() || title);
            setRenaming(false);
          }}
        >
          <input
            aria-label="Thread title"
            ref={(node) => node?.focus()}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRenaming(false);
            }}
            className="h-11 w-full rounded border-hairline border-border-3 bg-panel px-2 text-sm text-foreground outline-none focus-visible:outline-ring-inset"
          />
        </form>
      ) : null}
    </div>
  );
}

export type ThreadsListProps = {
  sections: ReadonlyArray<ThreadSection>;
  projects: ReadonlyMap<string, ProjectSummary>;
  modelName: (id: string) => string | undefined;
  groupedByProject: boolean;
  now: number;
  loading: boolean;
  emptyText: string;
  checked: ReadonlySet<string>;
  onCheckedChange: (checked: ReadonlySet<string>) => void;
  onDropOnSection?: (sectionId: string, threadId: string) => void;
  onArchive?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  footer?: ReactNode;
  icons?: ThreadsListIcons;
};

/** Sectioned thread rows with collapsible headers, a skeleton while loading and an empty line. */
export function ThreadsList({
  sections,
  projects,
  modelName,
  groupedByProject,
  now,
  loading,
  emptyText,
  checked,
  onCheckedChange,
  onDropOnSection,
  onArchive,
  onRename,
  footer,
  icons,
}: ThreadsListProps) {
  const [openState, setOpenState] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const isOpen = (id: string) => openState.get(id) ?? sectionStartsOpen(id);
  const toggle = (id: string) =>
    setOpenState((state) => new Map(state).set(id, !isOpen(id)));
  const onCheck = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCheckedChange(next);
  };

  if (sections.length === 0)
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <ThreadsListSkeleton />
        ) : (
          <div className="flex flex-1 items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
            {emptyText}
          </div>
        )}
        {footer}
      </div>
    );

  return (
    <div className="@container/list relative flex min-h-0 flex-1 flex-col [--thread-code-width:max-content]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1">
        {sections.map((section, index) => {
          const open = isOpen(section.id);
          return (
            <section
              key={section.id}
              data-section={section.id}
              role="group"
              aria-label={section.label}
              className={cx("relative flow-root", index > 0 && "mt-1")}
              onDragOver={(event) => {
                if (onDropOnSection !== undefined) event.preventDefault();
              }}
              onDrop={(event) => {
                const threadId =
                  event.dataTransfer.getData("text/x-kiki-thread");
                if (threadId !== "" && onDropOnSection !== undefined) {
                  event.preventDefault();
                  onDropOnSection(section.id, threadId);
                }
              }}
            >
              <button
                type="button"
                aria-expanded={open}
                data-panel-open={open ? "" : undefined}
                className="group/collapsible flex h-9 w-full cursor-pointer items-center gap-2 rounded-(--radius-card) bg-section px-2 text-left text-sm font-medium text-foreground transition-colors duration-100 outline-none focus-visible:outline-ring-inset"
                onClick={() => toggle(section.id)}
              >
                <span className="flex w-4 shrink-0 items-center justify-center">
                  <span className="flex size-(--icon-xs) shrink-0 -rotate-90 items-center justify-center text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/collapsible:rotate-0">
                    {icons?.chevron}
                  </span>
                </span>
                {section.label}
                {section.showCount ? (
                  <span className="font-normal text-muted-foreground-2 tabular-nums">
                    {section.members.length}
                  </span>
                ) : null}
              </button>
              {open ? (
                <div className={cx(section.members.length > 0 && "pt-1")}>
                  {section.members.map((thread) => (
                    <div key={thread.id} className="-m-0.5 p-0.5">
                      <ThreadRow
                        thread={thread}
                        projects={projects}
                        modelName={modelName}
                        groupedByProject={groupedByProject}
                        now={now}
                        checked={checked.has(thread.id)}
                        selectionMode={checked.size > 0}
                        onCheck={onCheck}
                        onArchive={onArchive}
                        onRename={onRename}
                        icons={icons}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
        <div className="pt-16">{footer}</div>
      </div>
    </div>
  );
}
