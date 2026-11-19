import { useAtomValue } from "@effect/atom-react";
import { LegendList } from "@legendapp/list/react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type DragEvent, type ReactNode, useEffect, useState } from "react";
import type { ChipThread } from "@/components/markdown-chips";
import { ThreadChipPreview } from "@/components/markdown-chips/previews";
import { ProviderIcon, providerOfModelId } from "@/components/model-picker";
import { ProjectChip } from "@/components/sidebar-threads";
import { threadTagsAtom } from "@/data/atoms/threadOrganization";
import { useRovingList } from "@/features/shell/keyboard";
import { Badge } from "@/primitives/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import {
  MenuItem,
  MenuLabel,
  MenuSearchRow,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "@/primitives/menu";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import { ScrollArea } from "@/primitives/scroll-area";
import { SkeletonPulse } from "@/primitives/skeleton-panel";
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
    <SkeletonPulse
      label="Loading threads"
      aria-label="Loading threads"
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
    </SkeletonPulse>
  );
}

export type ThreadRowProps = {
  thread: ThreadListItem;
  projects: ReadonlyMap<string, ProjectSummary>;
  /** The thread author's face, from the org's member directory. */
  authorAvatarUrl?: string | null;
  modelName: (id: string) => string | undefined;
  groupedByProject: boolean;
  now: number;
  checked: boolean;
  selectionMode: boolean;
  onCheck: (id: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onRename?: (id: string, title: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  menu?: ThreadRowMenuSources;
  icons?: ThreadsListIcons;
};

/**
 * The row menu's folder and tag sources. A caller that cannot offer them
 * (a test, or a surface with no folders) passes nothing and the rows stay out.
 */
export type ThreadRowMenuSources = {
  readonly orgId: string;
  readonly folders: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly moveTo: (id: string, folderId: string) => void;
  readonly tags: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  readonly toggleTag: (id: string, tagId: string, tagged: boolean) => void;
  readonly createTag: (id: string, name: string) => void;
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
  authorAvatarUrl,
  modelName,
  groupedByProject,
  now,
  checked,
  selectionMode,
  onCheck,
  onArchive,
  onRename,
  onPin,
  menu,
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
  const chip: ChipThread = {
    id: thread.id,
    code: threadCode(thread, projects) ?? "",
    title: thread.title,
    status: thread.status === "archived" ? "idle" : thread.status,
    archived: thread.archived,
    projectId: thread.projectId,
    modelLabel: model,
  };
  const row = (
    <Link
      to="/thread/$threadId"
      params={{ threadId: thread.id }}
      data-roving-item=""
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
        data-roving-check=""
        aria-label={checked ? "Deselect thread" : "Select thread"}
        aria-pressed={checked}
        className={cx(
          leadSlot,
          "flex cursor-pointer items-center justify-center outline-none",
          "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100",
          "pointer-coarse:hidden",
          (checked || selectionMode) && "opacity-100 pointer-coarse:flex",
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
      <span className={cx(leadSlot, "flex items-center justify-center")}>
        {thread.captain !== null ? (
          <span
            role="img"
            aria-label={thread.captain.name}
            className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-inner) text-2xs"
            style={
              thread.captain.background === undefined
                ? undefined
                : { background: thread.captain.background }
            }
          >
            {thread.captain.avatarUrl === null ? (
              thread.captain.name.slice(0, 1).toUpperCase()
            ) : (
              <img
                src={thread.captain.avatarUrl}
                alt=""
                draggable={false}
                className="size-full object-cover select-none"
              />
            )}
          </span>
        ) : authorAvatarUrl != null && authorAvatarUrl !== "" ? (
          <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
            <img
              alt={thread.title ?? ""}
              className="absolute inset-0 size-full object-cover"
              src={authorAvatarUrl}
            />
          </span>
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
        {thread.needsYou ? (
          <span
            role="img"
            aria-label="Waiting on you"
            className="block size-1.5 shrink-0 rounded-full bg-(--primary)"
          />
        ) : null}
        {thread.personal && thread.captain === null ? (
          <span className="text-muted-foreground-2">{icons?.person}</span>
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
            <span className="min-w-0 truncate">{thread.automationName}</span>
          </Badge>
        ) : null}
        {project !== undefined && !groupedByProject ? (
          <Badge size="base" className="@max-4xl/list:hidden">
            <ProjectChip
              project={{
                id: project.id,
                name: project.name,
                logoUrl: project.logoUrl ?? null,
                icon: project.icon,
              }}
              className="size-3"
            />
            {project.name}
          </Badge>
        ) : null}
        {model === undefined ? null : (
          <Badge size="base" className="@max-2xl/list:hidden">
            <ProviderIcon
              provider={providerOfModelId(thread.lastModelId ?? "")}
              className="size-3 shrink-0"
            />
            {model}
          </Badge>
        )}
      </span>
      <span className="flex w-14 shrink-0 items-center justify-end">
        <span className="block text-xs font-normal text-muted-foreground-2 tabular-nums">
          {formatAge(thread.sortActivityAt, { now, minified: true })}
        </span>
      </span>
    </Link>
  );

  return (
    <div className="group/row relative block">
      <PreviewCard>
        <ContextMenu>
          <ContextMenuTrigger render={<PreviewCardTrigger render={row} />} />
          <ContextMenuContent>
            <MenuItem
              onClick={() => {
                setDraft(thread.title ?? "");
                setRenaming(true);
              }}
            >
              Rename
            </MenuItem>
            {onPin === undefined ? null : (
              <MenuItem onClick={() => onPin(thread.id, !thread.pinned)}>
                <span className={pinIconClassName}>
                  <Icon name={thread.pinned ? "unpin" : "pin"} size="sm" />
                </span>
                {thread.pinned ? "Unpin" : "Pin"}
              </MenuItem>
            )}
            {menu === undefined ? null : (
              <MoveToRow threadId={thread.id} sources={menu} />
            )}
            {menu === undefined || menu.tags.length === 0 ? null : (
              <TagsRow threadId={thread.id} sources={menu} />
            )}
            <MenuItem
              command="menu.archive"
              onClick={() => onArchive?.(thread.id, !thread.archived)}
            >
              {thread.archived ? "Unarchive" : "Archive"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem onClick={() => onCheck(thread.id)}>
              {checked ? "Deselect" : "Select thread"}
            </MenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <PreviewCardContent side="right" align="start">
          <ThreadChipPreview thread={chip} />
        </PreviewCardContent>
      </PreviewCard>
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
  /** Thread author id → their avatar, so each row paints the face Capy paints. */
  authorAvatars?: ReadonlyMap<string, string>;
  loading: boolean;
  emptyText: string;
  checked: ReadonlySet<string>;
  onCheckedChange: (checked: ReadonlySet<string>) => void;
  onDropOnSection?: (sectionId: string, threadId: string) => void;
  onArchive?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  menu?: ThreadRowMenuSources;
  footer?: ReactNode;
  icons?: ThreadsListIcons;
};

/** Sectioned thread rows with collapsible headers, a skeleton while loading and an empty line. */
export type ThreadsListItem =
  | {
      readonly kind: "section";
      readonly section: ThreadSection;
      readonly open: boolean;
    }
  | { readonly kind: "row"; readonly thread: ThreadListItem };

/** Capy's list is one flat run of section heads and rows, so a window can scroll it. */
export const threadsListItems = (
  sections: ReadonlyArray<ThreadSection>,
  isOpen: (id: string) => boolean,
): ThreadsListItem[] =>
  sections.flatMap((section): ThreadsListItem[] => {
    const open = isOpen(section.id);
    const head: ThreadsListItem = { kind: "section", section, open };
    if (!open) return [head];
    return [
      head,
      ...section.members.map(
        (thread): ThreadsListItem => ({ kind: "row", thread }),
      ),
    ];
  });

const pinIconClassName = "kiki-icon text-icon-muted";

function MoveToRow({
  threadId,
  sources,
}: {
  readonly threadId: string;
  readonly sources: ThreadRowMenuSources;
}) {
  return (
    <MenuSub>
      <MenuSubTrigger>Move to</MenuSubTrigger>
      <MenuSubContent>
        {sources.folders.length === 0 ? (
          <MenuLabel>No folders yet</MenuLabel>
        ) : (
          sources.folders.map((folder) => (
            <MenuItem
              key={folder.id}
              onClick={() => sources.moveTo(threadId, folder.id)}
            >
              {folder.name}
            </MenuItem>
          ))
        )}
      </MenuSubContent>
    </MenuSub>
  );
}

/** Capy's Tags row: every tag, checked on the thread's own assignment, plus a create row. */
function TagsRow({
  threadId,
  sources,
}: {
  readonly threadId: string;
  readonly sources: ThreadRowMenuSources;
}) {
  const assigned = useAtomValue(threadTagsAtom(`${sources.orgId}/${threadId}`));
  const [draft, setDraft] = useState("");
  const on = new Set(
    AsyncResult.isSuccess(assigned)
      ? (assigned.value as ReadonlyArray<{ id?: string }>).map((tag) => tag.id)
      : [],
  );
  return (
    <MenuSub>
      <MenuSubTrigger>Tags</MenuSubTrigger>
      <MenuSubContent>
        {sources.tags.map((tag) => {
          const tagged = on.has(tag.id);
          return (
            <MenuItem
              key={tag.id}
              onClick={() => sources.toggleTag(threadId, tag.id, !tagged)}
            >
              <span className={pinIconClassName}>
                <Icon name={tagged ? "checkmark-1" : "tag"} size="sm" />
              </span>
              {tag.name}
            </MenuItem>
          );
        })}
        <MenuSeparator />
        <MenuSearchRow>
          <input
            aria-label="New tag"
            placeholder="New tag"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground-2"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              const name = draft.trim();
              if (name === "") return;
              sources.createTag(threadId, name);
              setDraft("");
            }}
          />
        </MenuSearchRow>
      </MenuSubContent>
    </MenuSub>
  );
}

const sectionHeadClassName =
  "group/collapsible flex h-9 w-full cursor-pointer items-center gap-2 rounded-(--radius-card) bg-section px-2 text-left text-sm font-medium text-foreground transition-colors duration-100 outline-none focus-visible:outline-ring-inset";

/** Sectioned thread rows in Capy's window, a skeleton while loading and an empty line. */
export function ThreadsList({
  sections,
  projects,
  modelName,
  groupedByProject,
  now,
  authorAvatars,
  loading,
  emptyText,
  checked,
  onCheckedChange,
  onDropOnSection,
  onArchive,
  onRename,
  onPin,
  menu,
  footer,
  icons,
}: ThreadsListProps) {
  const roving = useRovingList();
  const [openState, setOpenState] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [windowed, setWindowed] = useState(false);
  const isOpen = (id: string) => openState.get(id) ?? sectionStartsOpen(id);
  const toggle = (id: string) =>
    setOpenState((state) => new Map(state).set(id, !isOpen(id)));
  const onCheck = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCheckedChange(next);
  };

  useEffect(() => {
    if (viewport === null) return;
    const measure = () => setWindowed(viewport.clientHeight > 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport]);

  if (sections.length === 0)
    return (
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <ThreadsListSkeleton />
        ) : (
          <div className="flex flex-1 items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
            {emptyText}
          </div>
        )}
        {footer}
      </ScrollArea>
    );

  const items = threadsListItems(sections, isOpen);

  /** Capy's list items: the viewport is the list, so each item is a div with a listitem role. */
  const itemProps = (index: number) =>
    ({
      role: "listitem",
      "aria-posinset": index + 1,
      "aria-setsize": items.length,
    }) as const;

  const sectionItem = (
    section: ThreadSection,
    open: boolean,
    index: number,
  ) => (
    <div
      key={`section:${section.id}`}
      {...itemProps(index)}
      data-section={section.id}
      className="relative flow-root"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(section.id)}
        className={sectionHeadClassName}
        onDragOver={(event) => {
          if (onDropOnSection !== undefined) event.preventDefault();
        }}
        onDrop={(event) => {
          const threadId = event.dataTransfer.getData("text/x-kiki-thread");
          if (threadId !== "" && onDropOnSection !== undefined) {
            event.preventDefault();
            onDropOnSection(section.id, threadId);
          }
        }}
      >
        <span className="flex w-4 shrink-0 items-center justify-center">
          <span
            className={cx(
              "flex size-(--icon-xs) shrink-0 items-center justify-center text-muted-foreground-3 transition-transform duration-100",
              open ? "rotate-0" : "-rotate-90",
            )}
          >
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
    </div>
  );

  const rowItem = (thread: ThreadListItem, index: number) => {
    const first = index > 0 && items[index - 1]?.kind === "section";
    const next = items[index + 1];
    const last = next === undefined || next.kind === "section";
    return (
      <div
        key={`row:${thread.id}`}
        {...itemProps(index)}
        className={cx(
          "relative flow-root",
          first && "pt-1",
          last && "rounded-b",
        )}
      >
        <div className="-m-0.5 p-0.5">
          <ThreadRow
            thread={thread}
            projects={projects}
            authorAvatarUrl={authorAvatars?.get(thread.userId) ?? null}
            modelName={modelName}
            groupedByProject={groupedByProject}
            now={now}
            checked={checked.has(thread.id)}
            selectionMode={checked.size > 0}
            onCheck={onCheck}
            onArchive={onArchive}
            onRename={onRename}
            onPin={onPin}
            menu={menu}
            icons={icons}
          />
        </div>
      </div>
    );
  };

  const renderItem = (item: ThreadsListItem, index: number) =>
    item.kind === "section"
      ? sectionItem(item.section, item.open, index)
      : rowItem(item.thread, index);

  return (
    <div
      className="@container/list relative flex min-h-0 flex-1 flex-col [--thread-code-width:max-content]"
      {...roving}
    >
      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="px-2 pt-1"
        viewportProps={{ role: "list" }}
        onViewport={(node) => setViewport(node)}
      >
        {windowed ? (
          <LegendList<ThreadsListItem>
            data={items}
            scrollElement={viewport}
            estimatedItemSize={44}
            keyExtractor={(item) =>
              item.kind === "section"
                ? "section:" + item.section.id
                : "row:" + item.thread.id
            }
            ListFooterComponent={
              footer === undefined ? null : (
                <div className="pt-16">{footer}</div>
              )
            }
            renderItem={({ item, index }) => renderItem(item, index)}
          />
        ) : (
          <div>
            {items.map((item, index) => renderItem(item, index))}
            {footer === undefined ? null : (
              <div className="pt-16">{footer}</div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
