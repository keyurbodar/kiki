import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Glyph,
  ProjectChip,
  type SidebarDensity,
  type SidebarProject,
  type SidebarThread,
} from "@/components/sidebar-threads";
import { NeedsYouDot, ThreadStatusIcon } from "@/components/thread-status";
import { Button } from "@/primitives/button";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const rowTextClassName =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

export type SidebarThreadRowActions = {
  onSettle?: () => void;
  onUnsettle?: () => void;
  onArchive?: () => void;
  /** The row's `…` menu, shared with the list's context menu. */
  menu?: ReactNode;
  /** Replaces the title with an input while this row is being renamed. */
  renaming?: boolean;
  onRenameStart?: () => void;
  onRename?: (title: string) => void;
  onRenameCancel?: () => void;
};

export type SidebarThreadRowProps = ComponentProps<"div"> & {
  thread?: SidebarThread;
  project?: SidebarProject;
  density?: SidebarDensity;
  active?: boolean;
  actions?: SidebarThreadRowActions;
  preview?: ReactNode;
  /** Draws the row without its thread link, for a specimen that is not navigable. */
  decorative?: boolean;
};

const stopRowNavigation = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

function RenameField({
  title,
  onCommit,
  onCancel,
  className,
}: {
  title: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(title);
  const input = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    const next = draft.trim();
    if (commit && next !== "" && next !== title) onCommit(next);
    else onCancel();
  };
  return (
    <input
      ref={input}
      aria-label="Thread title"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onClick={stopRowNavigation}
      onDoubleClick={stopRowNavigation}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          finish(true);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          finish(false);
        }
      }}
      className={cx(
        "relative z-1 -mx-1 min-w-0 flex-1 rounded-sm bg-secondary px-1 text-base leading-5 text-foreground outline-none ring-1 ring-border-3",
        className,
      )}
    />
  );
}

function ClusterButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="bare"
            size="icon-shrink"
            aria-label={label}
            className="relative p-1"
            onClick={(event) => {
              stopRowNavigation(event);
              if (event.detail > 0) event.currentTarget.blur();
              onClick?.();
            }}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ThreadRowActions({
  slim,
  active,
  actions,
}: {
  slim: boolean;
  active: boolean;
  actions: SidebarThreadRowActions;
}) {
  return (
    <span
      className={cx(
        "mask-fade-l [--mask-fade-ramp:--spacing(8)] absolute right-0 flex items-center pr-1.5 pl-9",
        slim ? "inset-y-0 rounded-r" : "top-1.5 h-5",
        "origin-right pointer-events-none opacity-0 transition-[opacity,scale] duration-100 motion-safe:scale-[0.98]",
        "group-hover/thread:opacity-100 motion-safe:group-hover/thread:scale-100",
        "group-data-[popup-open]/thread:opacity-100 motion-safe:group-data-[popup-open]/thread:scale-100",
        "has-[[data-popup-open]]:opacity-100 motion-safe:has-[[data-popup-open]]:scale-100",
        "focus-within:opacity-100 motion-safe:focus-within:scale-100",
      )}
    >
      {active ? (
        <span aria-hidden className="absolute inset-0 rounded-r bg-card" />
      ) : (
        <>
          <span aria-hidden className="absolute inset-0 rounded-r bg-chrome" />
          <span
            aria-hidden
            className="absolute inset-0 rounded-r bg-secondary"
          />
        </>
      )}
      <span className="pointer-events-none relative flex items-center group-hover/thread:[&_button]:pointer-events-auto group-data-[popup-open]/thread:[&_button]:pointer-events-auto has-[[data-popup-open]]:[&_button]:pointer-events-auto focus-within:[&_button]:pointer-events-auto">
        {actions.onSettle === undefined ? null : (
          <ClusterButton label="Settle" onClick={actions.onSettle}>
            <Glyph name="checkmark-1" className="size-(--icon-sm)" />
          </ClusterButton>
        )}
        {actions.onUnsettle === undefined ? null : (
          <ClusterButton label="Un-settle" onClick={actions.onUnsettle}>
            <Glyph name="arrow-rotate-clockwise" className="size-(--icon-sm)" />
          </ClusterButton>
        )}
        {actions.onArchive === undefined ? null : (
          <ClusterButton label="Archive thread" onClick={actions.onArchive}>
            <Glyph name="archive" className="size-(--icon-sm)" />
          </ClusterButton>
        )}
        {actions.menu === undefined ? null : (
          <ResponsiveMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <ResponsiveMenuTrigger
                    render={
                      <Button
                        variant="bare"
                        size="icon-shrink"
                        aria-label="Thread actions"
                        className="relative p-1"
                        onClick={stopRowNavigation}
                      />
                    }
                  >
                    <Glyph
                      name="dot-grid-1x3-horizontal"
                      className="size-(--icon-sm)"
                    />
                  </ResponsiveMenuTrigger>
                }
              />
              <TooltipContent side="bottom">More actions</TooltipContent>
            </Tooltip>
            <ResponsiveMenuContent align="end" className="w-52">
              {actions.menu}
            </ResponsiveMenuContent>
          </ResponsiveMenu>
        )}
      </span>
    </span>
  );
}

export function SidebarThreadRow({
  thread,
  project,
  density = "detailed",
  active = false,
  actions,
  preview,
  decorative = false,
  className,
  ...props
}: SidebarThreadRowProps) {
  if (thread === undefined) {
    return (
      <div data-slot="sidebar-thread-row" className={className} {...props} />
    );
  }
  const slim = density === "compact";
  const busy = thread.status === "working" || thread.status === "waiting";
  const unread = thread.hasUnreads && !busy;
  const needsYou = thread.needsYou && thread.status !== "working";
  const ask = needsYou ? (thread.ask ?? undefined) : undefined;
  const titleClassName = cx(
    "text-base leading-5",
    unread ? "font-medium" : "font-normal",
    unread || active
      ? "text-foreground"
      : "text-foreground/90 group-hover/thread:text-foreground group-focus-visible/row:text-foreground",
  );
  const title =
    actions?.renaming === true && actions.onRename !== undefined ? (
      <RenameField
        title={thread.title ?? ""}
        onCommit={actions.onRename}
        onCancel={() => actions.onRenameCancel?.()}
        className={titleClassName}
      />
    ) : (
      // biome-ignore lint/a11y/noStaticElementInteractions: double-click is a pointer shortcut for rename; the row menu's Rename is the keyboard path
      <span
        className={cx(rowTextClassName, titleClassName)}
        onDoubleClick={
          thread.owner && actions?.onRenameStart !== undefined
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                actions.onRenameStart?.();
              }
            : undefined
        }
      >
        {thread.title ?? "Untitled thread"}
      </span>
    );
  const statusMark = busy ? (
    <span
      className={cx(
        "flex shrink-0",
        thread.status === "working" && "text-primary-ink",
      )}
    >
      <ThreadStatusIcon
        state={thread.status === "working" ? "working" : "waiting"}
      />
    </span>
  ) : null;
  const age = (
    <span
      className="shrink-0 text-xs text-muted-foreground tabular-nums"
      suppressHydrationWarning
    >
      {thread.age}
    </span>
  );
  const machine = thread.machine;
  const meta =
    ask === undefined ? (
      <>
        {project === undefined ? null : (
          <span className="flex shrink-0 opacity-80">
            <ProjectChip project={project} />
          </span>
        )}
        {project === undefined ? (
          <span className="flex-1" />
        ) : (
          <span className={rowTextClassName}>{project.name}</span>
        )}
        {machine === null ? null : (
          <span className="flex max-w-3/5 min-w-0 shrink-0 items-center gap-1.5 opacity-80">
            {machine.kind === "device" ? (
              <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap">
                {machine.name}
              </span>
            ) : null}
          </span>
        )}
      </>
    ) : (
      <span className={cx(rowTextClassName, "text-primary-ink")}>{ask}</span>
    );
  const rowClassName = cx(
    "group/row flex gap-2.5 rounded px-2 outline-none select-none [-webkit-touch-callout:none]",
    slim ? "h-8 items-center" : "h-13 items-start py-1.5",
    "transition-colors duration-100 focus-visible:outline-ring-inset",
    active ? "bg-card shadow-row-open" : "group-hover/thread:bg-secondary",
  );
  const rowContent = slim ? (
    <>
      {title}
      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {needsYou ? <NeedsYouDot /> : statusMark}
        {age}
      </span>
    </>
  ) : (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex h-5 min-w-0 items-center gap-2">
        {title}
        {needsYou && ask === undefined ? <NeedsYouDot /> : statusMark}
        {age}
      </span>
      <span className="@container flex h-4 min-w-0 items-center gap-1.5 text-xs text-muted-foreground-2">
        {meta}
      </span>
    </span>
  );
  if (decorative) {
    return (
      <div
        data-drag-row
        data-row-menu=""
        className={cx("group/thread relative block", className)}
        {...props}
      >
        <span
          data-slot="sidebar-thread-row"
          data-sidebar-target={thread.id}
          aria-current={active ? "page" : undefined}
          className={rowClassName}
        >
          {rowContent}
        </span>
      </div>
    );
  }
  return (
    <div
      data-drag-row
      data-row-menu=""
      className={cx("group/thread relative block", className)}
      {...props}
    >
      <PreviewCard>
        <PreviewCardTrigger
          render={
            <Link to="/thread/$threadId" params={{ threadId: thread.id }} />
          }
          data-slot="sidebar-thread-row"
          data-thread-preview=""
          data-sidebar-target={thread.id}
          aria-current={active ? "page" : undefined}
          className={rowClassName}
        >
          {rowContent}
        </PreviewCardTrigger>
        {preview === undefined ? null : (
          <PreviewCardContent side="right" align="start">
            {preview}
          </PreviewCardContent>
        )}
      </PreviewCard>
      {actions === undefined ? null : (
        <ThreadRowActions slim={slim} active={active} actions={actions} />
      )}
    </div>
  );
}
