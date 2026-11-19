import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type ComponentProps, Fragment, type ReactNode } from "react";
import {
  CrewCountBadge,
  NeedsYouDot,
  ThreadStatusIcon,
  threadStatusState,
} from "@/components/thread-status";
import { useRovingList } from "@/features/shell/keyboard";
import {
  CaptainAvatar as CaptainAvatarTile,
  DEFAULT_CAPTAIN_AVATAR,
} from "@/primitives/captain-avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import { ScrollArea } from "@/primitives/scroll-area";
import { Glyph } from "./glyphs";
import { SidebarRowPopups } from "./sidebar-row-popups";
import type {
  SidebarCaptain,
  SidebarDensity,
  SidebarSection,
  SidebarThread,
  SidebarThreadsView,
} from "./types";

export const sidebarSectionHeaderClassName = cx(
  "kiki-sidebar-section min-w-0 flex-1 cursor-pointer text-xs text-muted-foreground-2 outline-none select-none",
  "transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset",
);

export type SectionHeadingProps = {
  label: string;
  count?: number | string;
  countAtRest?: boolean;
  slot?: ReactNode;
  /** A folder header's options button, held over the chevron's cell. */
  actions?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function SectionHeading({
  label,
  count,
  countAtRest = false,
  slot,
  actions,
  open,
  onOpenChange,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cx(
        "group/folder relative flex min-w-0 items-center",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={sidebarSectionHeaderClassName}
      >
        <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap">
          {label}
        </span>
        {count === undefined || count === 0 ? null : (
          <span
            className={cx(
              "shrink-0 text-muted-foreground-3 tabular-nums",
              !countAtRest &&
                "opacity-0 transition-opacity duration-100 group-hover/folder:opacity-100 group-has-[:focus-visible]/folder:opacity-100",
            )}
          >
            {count}
          </span>
        )}
        <Glyph
          name="chevron-down-small"
          className={cx(
            "-mx-0.5 size-(--icon-xs) shrink-0 text-muted-foreground-3 opacity-0 transition-opacity duration-100",
            "group-hover/folder:opacity-100 group-has-[:focus-visible]/folder:opacity-100",
            !open && "-rotate-90",
          )}
        />
        {slot === undefined ? null : (
          <span className="ml-auto flex shrink-0 items-center">{slot}</span>
        )}
      </button>
      {actions === undefined ? null : (
        <span className="kiki-sidebar-section-actions">{actions}</span>
      )}
    </div>
  );
}

export type GroupMore =
  | { state: "hidden"; count: number }
  | { state: "more" | "loading" | "retry" };

export const groupMoreLabel = (more: GroupMore) =>
  more.state === "hidden"
    ? `Show ${more.count} more`
    : more.state === "loading"
      ? "Loading more"
      : more.state === "retry"
        ? "Retry loading"
        : "Show more";

export function GroupMoreRow({
  more,
  onClick,
  className,
}: {
  more: GroupMore;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={more.state === "loading"}
      onClick={onClick}
      className={cx(
        "relative flex h-7 w-full shrink-0 cursor-pointer items-center rounded px-2 text-sm font-normal text-muted-foreground-2 outline-none select-none",
        "transition-colors duration-100 hover:bg-secondary",
        "focus-visible:outline-ring-inset",
        "disabled:cursor-default disabled:hover:bg-transparent",
        "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
        className,
      )}
    >
      {groupMoreLabel(more)}
    </button>
  );
}

export function NewThreadRow({
  slim,
  onClick,
}: {
  slim: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full min-w-0 gap-2.5 rounded px-2 text-left outline-none select-none",
        slim ? "h-8 items-center" : "h-13 items-start py-1.5",
        "transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="mask-fade-r overflow-hidden text-base leading-5 font-normal whitespace-nowrap text-foreground">
          New thread
        </span>
        {slim ? null : (
          <span className="mask-fade-r overflow-hidden text-xs leading-4 whitespace-nowrap text-muted-foreground-2">
            Ask Capy to build or fix something
          </span>
        )}
      </span>
    </button>
  );
}

export function CaptainAvatar({
  captain,
  compact,
}: {
  captain: Pick<SidebarCaptain, "name" | "avatar">;
  compact: boolean;
}) {
  return (
    <CaptainAvatarTile
      avatar={captain.avatar}
      name={captain.name}
      size={compact ? "compact" : "base"}
    />
  );
}

export function NewCaptainRow({
  compact,
  onClick,
}: {
  compact: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full min-w-0 items-center gap-2.5 rounded px-2 text-left outline-none select-none",
        compact ? "h-8" : "h-13",
        "transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "flex shrink-0 items-center justify-center",
          compact ? "size-5" : "size-8",
        )}
      >
        <CaptainAvatar
          captain={{ name: "New Captain", avatar: DEFAULT_CAPTAIN_AVATAR }}
          compact={compact}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="mask-fade-r overflow-hidden text-base leading-5 font-normal whitespace-nowrap text-foreground">
          New Captain
        </span>
        {compact ? null : (
          <span className="mask-fade-r overflow-hidden text-xs leading-4 font-normal whitespace-nowrap text-muted-foreground-2">
            Runs a crew of threads for you
          </span>
        )}
      </span>
    </button>
  );
}

export type CaptainRowProps = {
  captain: SidebarCaptain;
  compact: boolean;
  active: boolean;
  preview?: ReactNode;
};

export function CaptainRow({
  captain,
  compact,
  active,
  preview,
}: CaptainRowProps) {
  const busy = captain.status === "working" || captain.status === "waiting";
  const needsYou = captain.needsYou && captain.status !== "working";
  const ask = needsYou ? captain.ask : null;
  const crewBadge =
    captain.crewMentionCount > 0 ? (
      <CrewCountBadge count={captain.crewMentionCount} />
    ) : null;
  const mark =
    needsYou && ask === null && captain.preview === null ? (
      <NeedsYouDot />
    ) : busy ? (
      <span
        className={cx(
          "flex",
          captain.status === "working" && "text-primary-ink",
        )}
      >
        <ThreadStatusIcon state={threadStatusState(captain.status)} />
      </span>
    ) : null;
  const titleClassName = cx(
    "text-base",
    captain.hasUnreads ? "font-medium" : "font-normal",
    captain.hasUnreads || active ? "text-foreground" : "text-foreground/75",
  );
  const age = (
    <span
      className="shrink-0 text-xs leading-5 text-muted-foreground tabular-nums"
      suppressHydrationWarning
    >
      {captain.age}
    </span>
  );
  return (
    <div
      data-captain-row={captain.id}
      data-row-menu=""
      data-sidebar-target={captain.id}
      className="group/captain"
    >
      <PreviewCard>
        <PreviewCardTrigger
          render={
            <Link to="/thread/$threadId" params={{ threadId: captain.id }} />
          }
          data-roving-item=""
          aria-label={`${captain.name}${captain.hasUnreads ? ", unread" : ""}`}
          aria-current={active ? "page" : undefined}
          className={cx(
            "relative flex min-w-0 flex-1 rounded outline-none select-none [-webkit-touch-callout:none]",
            "items-center px-2",
            compact ? "h-8 gap-2.5" : "h-13 gap-2.5",
            "transition-colors duration-100 group-hover/captain:bg-secondary",
            "focus-visible:outline-ring-inset",
            active && "bg-secondary",
          )}
        >
          <span
            aria-hidden
            className={cx(
              "flex shrink-0 items-center justify-center",
              compact ? "size-5" : "size-8",
            )}
          >
            <CaptainAvatar captain={captain} compact={compact} />
          </span>
          {compact ? (
            <>
              <span
                className={cx(
                  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-5",
                  titleClassName,
                )}
              >
                {captain.name}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {crewBadge}
                {mark}
                {age}
              </span>
            </>
          ) : (
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex h-5 min-w-0 items-baseline gap-2">
                <span
                  className={cx(
                    "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-5",
                    titleClassName,
                  )}
                >
                  {captain.name}
                </span>
                {mark}
                {age}
              </span>
              <span className="flex h-4 min-w-0 items-center gap-2">
                <span className="flex min-w-0 flex-1">
                  <span
                    className={cx(
                      "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap text-xs leading-4",
                      ask === null
                        ? "font-normal text-muted-foreground"
                        : "text-primary-ink",
                    )}
                  >
                    {ask ?? captain.preview}
                  </span>
                </span>
                {crewBadge === null ? null : (
                  <span className="flex shrink-0 items-center">
                    {crewBadge}
                  </span>
                )}
              </span>
            </span>
          )}
        </PreviewCardTrigger>
        {preview === undefined ? null : (
          <PreviewCardContent side="right" align="start">
            {preview}
          </PreviewCardContent>
        )}
      </PreviewCard>
    </div>
  );
}

type PinnedCaptainsProps = {
  captains: ReadonlyArray<SidebarCaptain>;
  activeId?: string | null;
  renderPreview?: (
    captain: SidebarCaptain,
    context: { density: SidebarDensity; active: boolean },
  ) => ReactNode;
};

function pinnedPresence(captain: SidebarCaptain) {
  if (captain.status === "working") return "working" as const;
  if (captain.needsYou) return "needs-you" as const;
  if (captain.status === "waiting") return "waiting" as const;
  if (captain.status === "failed") return "failed" as const;
  return null;
}

/**
 * The pinned Captain tiles at the top of the Captains section: a three-up grid
 * of faces with the name under each and the presence dot in a clipped corner.
 */
export function PinnedCaptains({
  captains,
  activeId,
  renderPreview,
}: PinnedCaptainsProps) {
  const pinned = captains.filter((captain) => captain.card?.pinned === true);
  if (pinned.length === 0) return null;
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's pinned grid is a div with role=group
    <div
      role="group"
      aria-label="Pinned"
      className="mx-auto flex w-full flex-wrap justify-center gap-y-(--sidebar-pin-gap-y) pb-3"
      style={{ maxWidth: 276 }}
    >
      {pinned.map((captain) => {
        const active = activeId === captain.id;
        const presence = pinnedPresence(captain);
        const preview = renderPreview?.(captain, {
          density: "detailed",
          active,
        });
        return (
          <div
            key={captain.id}
            className="flex justify-center"
            style={{ width: "calc(100% / 3)" }}
          >
            <div
              data-captain-row={captain.id}
              data-row-menu=""
              data-sidebar-target={captain.id}
              className="group/captain relative flex w-(--sidebar-pin-cell) items-center"
            >
              <PreviewCard>
                <PreviewCardTrigger
                  render={
                    <Link
                      to="/thread/$threadId"
                      params={{ threadId: captain.id }}
                    />
                  }
                  aria-label={captain.name}
                  aria-current={active ? "page" : undefined}
                  className="relative flex w-(--sidebar-pin-cell) min-w-0 flex-none flex-col items-center gap-(--sidebar-pin-label-gap) py-1 rounded outline-none select-none [-webkit-touch-callout:none] transition-colors duration-100 group-hover/captain:bg-secondary focus-visible:outline-ring-inset"
                >
                  <span className="relative flex">
                    <span className="flex mask-notch-br">
                      <CaptainAvatarTile
                        avatar={captain.avatar}
                        name={captain.name}
                        size="xl"
                      />
                    </span>
                    {presence === null ? null : (
                      <span className="absolute -right-0.5 -bottom-0.5 flex">
                        <ThreadStatusIcon state={presence} size="xs" />
                      </span>
                    )}
                  </span>
                  <span
                    className={cx(
                      "max-w-full overflow-hidden text-ellipsis px-0.5 text-xs leading-4 whitespace-nowrap",
                      active || captain.hasUnreads
                        ? "font-medium text-foreground"
                        : "font-normal text-foreground/80 dark:text-muted-foreground-1",
                    )}
                  >
                    {captain.name}
                  </span>
                </PreviewCardTrigger>
                {preview === undefined ? null : (
                  <PreviewCardContent side="right" align="start">
                    {preview}
                  </PreviewCardContent>
                )}
              </PreviewCard>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type SidebarThreadRenderContext = {
  section: SidebarSection;
  density: SidebarDensity;
  active: boolean;
};

export type SidebarThreadsProps = ComponentProps<"div"> & {
  view?: SidebarThreadsView;
  leading?: ReactNode;
  actions?: ReactNode;
  /** The Captains section's own header actions, separate from the threads' ones. */
  captainActions?: ReactNode;
  /**
   * The Captains section's rows. Defaults to the view's rows; swapping the sample
   * source for the org's Captains is this one prop at one call site.
   */
  captainsSource?: ReadonlyArray<SidebarCaptain>;
  renderThread?: (
    thread: SidebarThread,
    context: SidebarThreadRenderContext,
  ) => ReactNode;
  renderCaptain?: (
    captain: SidebarCaptain,
    context: Pick<SidebarThreadRenderContext, "density" | "active">,
  ) => ReactNode;
  onSectionOpenChange?: (sectionId: string, open: boolean) => void;
  onShowMore?: (sectionId: string) => void;
  onNewThread?: () => void;
  onNewCaptain?: () => void;
  /**
   * The thread menu shared by the rows' `…` clusters and the list's right-click.
   * `rowKey` is the section of the row it was opened from, because one thread
   * renders once per section it appears in.
   */
  renderRowMenu?: (thread: SidebarThread, rowKey?: string) => ReactNode;
  /** The Captain menu the Captain rows open on right-click. */
  renderCaptainMenu?: (captain: SidebarCaptain) => ReactNode;
  /** A folder header's options button. */
  renderSectionActions?: (section: SidebarSection) => ReactNode;
  /** The same folder menu, opened by a right-click on the header. */
  renderSectionMenu?: (section: SidebarSection) => ReactNode;
};

export function SidebarThreads({
  view,
  leading,
  actions,
  captainActions,
  captainsSource,
  renderThread,
  renderCaptain,
  onSectionOpenChange,
  onShowMore,
  onNewThread,
  onNewCaptain,
  renderRowMenu,
  renderCaptainMenu,
  renderSectionActions,
  renderSectionMenu,
  className,
  ...props
}: SidebarThreadsProps) {
  const roving = useRovingList();
  if (view === undefined) {
    return (
      <div
        className={cx("mt-3 flex min-h-0 flex-1 flex-col", className)}
        {...props}
      />
    );
  }
  const split = view.layout === "split";
  const captainsMode = view.mode === "captains";
  const showCaptains = split ? captainsMode : true;
  const showThreads = split ? !captainsMode : true;
  const slim = view.density === "compact";
  const captainList = captainsSource ?? view.captains;
  const captainRows =
    captainList.length === 0 ? (
      <NewCaptainRow compact={slim} onClick={onNewCaptain} />
    ) : (
      captainList.map((captain) => {
        const active = view.activeId === captain.id;
        return (
          <CaptainRow
            key={captain.id}
            captain={captain}
            compact={slim}
            active={active}
            preview={renderCaptain?.(captain, {
              density: view.density,
              active,
            })}
          />
        );
      })
    );
  const rowMenuThreads = new Map(
    view.sections.flatMap((section) =>
      section.threads.map((thread) => [thread.id, thread] as const),
    ),
  );
  const rowMenuCaptains = new Map(
    captainList.map((captain) => [captain.id, captain] as const),
  );
  return (
    <SidebarRowPopups
      threads={rowMenuThreads}
      captains={rowMenuCaptains}
      renderMenu={renderRowMenu}
      renderCaptainMenu={renderCaptainMenu}
      mode={view.mode}
      className={cx(
        "mt-3 flex min-h-0 flex-1 flex-col [timeline-scope:--threads-scroll]",
        className,
      )}
      {...roving}
      {...props}
    >
      <div
        aria-hidden
        className="scroll-divider-t max-md:hidden [--scroll-divider-timeline:--threads-scroll]"
      />
      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="[scroll-timeline:--threads-scroll]"
      >
        {showCaptains ? (
          <div className="sticky top-0 z-1 flex h-8 shrink-0 items-center gap-1 bg-panel px-2 pb-1">
            {leading}
            <span className="px-2 text-sm font-medium text-foreground select-none">
              Captains
            </span>
            <div className="ml-auto flex items-center">{captainActions}</div>
          </div>
        ) : null}
        <div className="flex min-h-full flex-col px-2">
          {/* biome-ignore lint/a11y/useSemanticElements: Capy's sidebar list is a div with role=list */}
          <div role="list" className="flex flex-col">
            {showCaptains ? (
              <>
                <PinnedCaptains
                  captains={captainList}
                  activeId={view.activeId}
                  renderPreview={renderCaptain}
                />
                {captainRows}
              </>
            ) : null}
            {showThreads ? (
              <>
                <div
                  className={cx(
                    "flex h-8 shrink-0 items-center gap-1 pb-1",
                    showCaptains && "mt-(--sidebar-section-gap)",
                  )}
                >
                  <span className="px-2 text-sm font-medium text-foreground select-none">
                    Threads
                  </span>
                  <div className="ml-auto flex items-center">{actions}</div>
                </div>
                <ThreadSections
                  view={view}
                  renderThread={renderThread}
                  onSectionOpenChange={onSectionOpenChange}
                  onShowMore={onShowMore}
                  onNewThread={onNewThread}
                  renderSectionActions={renderSectionActions}
                  renderSectionMenu={renderSectionMenu}
                />
              </>
            ) : null}
          </div>
        </div>
      </ScrollArea>
    </SidebarRowPopups>
  );
}

function ThreadSections({
  view,
  renderThread,
  onSectionOpenChange,
  onShowMore,
  onNewThread,
  renderSectionActions,
  renderSectionMenu,
}: Pick<
  SidebarThreadsProps,
  | "renderThread"
  | "onSectionOpenChange"
  | "onShowMore"
  | "onNewThread"
  | "renderSectionActions"
  | "renderSectionMenu"
> & { view: SidebarThreadsView }) {
  const slim = view.density === "compact";
  const items: ReactNode[] = [];
  let afterRows = false;
  if (view.sections.every((section) => section.count === 0)) {
    items.push(
      <NewThreadRow key="threads:new" slim={slim} onClick={onNewThread} />,
    );
    afterRows = true;
  }
  for (const section of view.sections) {
    const droppable = section.kind === "folder" || section.kind === "pinned";
    if (section.count === 0 && !droppable) continue;
    const gap = afterRows ? "mt-(--sidebar-section-gap)" : undefined;
    const heading = (
      <SectionHeading
        label={section.label}
        count={section.count}
        countAtRest={section.countAtRest}
        open={section.open}
        onOpenChange={(open) => onSectionOpenChange?.(section.id, open)}
        actions={renderSectionActions?.(section)}
        className={gap}
      />
    );
    const menu = renderSectionMenu?.(section);
    items.push(
      <Fragment key={section.id}>
        {menu === undefined || menu === null ? (
          heading
        ) : (
          <ContextMenu>
            <ContextMenuTrigger className="contents">
              {heading}
            </ContextMenuTrigger>
            <ContextMenuContent className="kiki-menu">
              {menu}
            </ContextMenuContent>
          </ContextMenu>
        )}
      </Fragment>,
    );
    afterRows = false;
    if (!section.open) continue;
    for (const thread of section.threads) {
      afterRows = true;
      items.push(
        // biome-ignore lint/a11y/useSemanticElements: rows sit in Capy's div role=list
        <div
          key={`${section.id}:${thread.id}`}
          role="listitem"
          data-section-id={section.id}
        >
          {renderThread?.(thread, {
            section,
            density: view.density,
            active: view.activeId === thread.id,
          })}
        </div>,
      );
    }
    if (section.hidden > 0) {
      items.push(
        <GroupMoreRow
          key={`${section.id}:more`}
          more={{ state: "hidden", count: section.hidden }}
          onClick={() => onShowMore?.(section.id)}
        />,
      );
    }
  }
  return items;
}
