import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import {
  CrewCountBadge,
  NeedsYouDot,
  ThreadStatusIcon,
  threadStatusState,
} from "@/components/thread-status";
import {
  CaptainAvatar as CaptainAvatarTile,
  DEFAULT_CAPTAIN_AVATAR,
} from "@/primitives/captain-avatar";
import { ScrollArea } from "@/primitives/scroll-area";
import { Glyph } from "./glyphs";
import { type SidebarRowActions, SidebarRowPopups } from "./sidebar-row-popups";
import type {
  SidebarCaptain,
  SidebarDensity,
  SidebarSection,
  SidebarThread,
  SidebarThreadsView,
} from "./types";

export const sidebarSectionHeaderClassName = cx(
  "flex h-(--sidebar-section-header) min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded px-2 text-left text-xs text-muted-foreground-2 outline-none select-none",
  "transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset",
);

export type SectionHeadingProps = {
  label: string;
  count?: number | string;
  countAtRest?: boolean;
  slot?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function SectionHeading({
  label,
  count,
  countAtRest = false,
  slot,
  open,
  onOpenChange,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx("group/folder flex min-w-0 items-center", className)}>
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
};

export function CaptainRow({ captain, compact, active }: CaptainRowProps) {
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
    <div data-captain-row={captain.id} className="group/captain">
      <Link
        to="/thread/$threadId"
        params={{ threadId: captain.id }}
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
                <span className="flex shrink-0 items-center">{crewBadge}</span>
              )}
            </span>
          </span>
        )}
      </Link>
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
  onSectionOpenChange?: (sectionId: string, open: boolean) => void;
  onShowMore?: (sectionId: string) => void;
  onNewThread?: () => void;
  onNewCaptain?: () => void;
  rowActions?: SidebarRowActions;
};

export function SidebarThreads({
  view,
  leading,
  actions,
  captainActions,
  captainsSource,
  renderThread,
  onSectionOpenChange,
  onShowMore,
  onNewThread,
  onNewCaptain,
  rowActions,
  className,
  ...props
}: SidebarThreadsProps) {
  if (view === undefined) {
    return (
      <div
        className={cx("mt-3 flex min-h-0 flex-1 flex-col", className)}
        {...props}
      />
    );
  }
  const captains = view.mode === "captains";
  const slim = view.density === "compact";
  const captainList = captainsSource ?? view.captains;
  const captainRows =
    captainList.length === 0 ? (
      <NewCaptainRow compact={slim} onClick={onNewCaptain} />
    ) : (
      captainList.map((captain) => (
        <CaptainRow
          key={captain.id}
          captain={captain}
          compact={slim}
          active={view.activeId === captain.id}
        />
      ))
    );
  const rowMenuThreads = new Map(
    view.sections.flatMap((section) =>
      section.threads.map((thread) => [
        thread.id,
        { id: thread.id, hasUnreads: thread.hasUnreads },
      ]),
    ),
  );
  return (
    <SidebarRowPopups
      threads={rowMenuThreads}
      actions={rowActions}
      mode={view.mode}
      className={cx(
        "mt-3 flex min-h-0 flex-1 flex-col [timeline-scope:--threads-scroll]",
        className,
      )}
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
        <div className="sticky top-0 z-1 flex h-8 shrink-0 items-center gap-1 bg-panel px-2 pb-1">
          {leading}
          <span className="px-2 text-sm font-medium text-foreground select-none">
            Captains
          </span>
          <div className="ml-auto flex items-center">{captainActions}</div>
        </div>
        <div className="flex min-h-full flex-col px-2">
          {/* biome-ignore lint/a11y/useSemanticElements: Capy's sidebar list is a div with role=list */}
          <div role="list" className="flex flex-col">
            {captainRows}
            {captains ? null : (
              <>
                <div className="mt-(--sidebar-section-gap) flex h-8 shrink-0 items-center gap-1 pb-1">
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
                />
              </>
            )}
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
}: Pick<
  SidebarThreadsProps,
  "renderThread" | "onSectionOpenChange" | "onShowMore" | "onNewThread"
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
    if (section.count === 0) continue;
    items.push(
      <SectionHeading
        key={section.id}
        label={section.label}
        count={section.count}
        countAtRest={section.countAtRest}
        open={section.open}
        onOpenChange={(open) => onSectionOpenChange?.(section.id, open)}
        className={afterRows ? "mt-(--sidebar-section-gap)" : undefined}
      />,
    );
    afterRows = false;
    if (!section.open) continue;
    for (const thread of section.threads) {
      afterRows = true;
      items.push(
        // biome-ignore lint/a11y/useSemanticElements: rows sit in Capy's div role=list
        <div key={`${section.id}:${thread.id}`} role="listitem">
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
