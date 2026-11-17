import { type ReactNode, useRef } from "react";
import type { ImportSessionProgress } from "@/components/import-job-indicator";
import { Checkbox } from "@/primitives/checkbox";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  cx,
  formatEndedAt,
  type ImportSession,
  type ImportSource,
  lastSegment,
} from "./import-model";

export const ROW_CLASS =
  "flex h-(--h-menu-row) items-center gap-2 rounded px-2 text-sm transition-colors duration-100";

export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cx("size-4 shrink-0", className)}
    >
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SourceIcon({
  source,
  className,
}: {
  source: ImportSource;
  className?: string;
}) {
  return (
    <Icon name="console-sparkle" data-source={source} className={className} />
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" aria-label={label} className="shrink-0">
      <Icon name="progress-75" size="xs" className="animate-spin" />
    </span>
  );
}

export function SectionHeader({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  return (
    <div className="mb-0.5 flex h-8 items-center gap-1.5 rounded-(--radius-card) bg-section px-2 text-xs">
      <span className="font-medium text-muted-foreground-1">{children}</span>
      <span className="text-muted-foreground-3 tabular-nums">{count}</span>
    </div>
  );
}

export type GroupHeaderProps = {
  icon: ReactNode;
  name: string;
  detail: string;
  open: boolean;
  onToggle: () => void;
  picked: number;
  total: number;
  onCheck: (checked: boolean) => void;
  busy: boolean;
};

export function GroupHeader({
  icon,
  name,
  detail,
  open,
  onToggle,
  picked,
  total,
  onCheck,
  busy,
}: GroupHeaderProps) {
  return (
    <div className={cx(ROW_CLASS, "group/row hover:bg-section")}>
      <Checkbox
        aria-label={`Select ${name}`}
        checked={total > 0 && picked === total}
        indeterminate={picked > 0 && picked < total}
        disabled={busy || total === 0}
        onCheckedChange={(checked) => onCheck(checked === true)}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="shrink-0 [&_svg]:size-4 [&_svg]:text-muted-foreground-1">
          {icon}
        </span>
        <span className="truncate font-medium text-foreground" title={name}>
          <span className="md:hidden">{lastSegment(name)}</span>
          <span className="hidden md:inline">{name}</span>
        </span>
        {detail === "" ? null : (
          <span className="truncate text-muted-foreground-2">{detail}</span>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground-2 tabular-nums">
          {total === 0 ? "imported" : total}
        </span>
        <ChevronDown
          className={cx(
            "text-muted-foreground-3 transition-transform duration-100",
            !open && "-rotate-90",
          )}
        />
      </button>
    </div>
  );
}

export type SessionRowProps = {
  session: ImportSession;
  state: ImportSessionProgress | undefined;
  busy: boolean;
  selected: boolean;
  onSelect: (shift: boolean) => void;
};

function SessionStatus({
  session,
  state,
}: Pick<SessionRowProps, "session" | "state">) {
  if (state !== undefined && state.phase !== "done" && state.phase !== "failed")
    return <Spinner label="Importing" />;
  if (state?.phase === "failed")
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="shrink-0 text-xs text-destructive">failed</span>
          }
        />
        <TooltipContent className="max-w-sm">
          {state.detail ?? "Import failed"}
        </TooltipContent>
      </Tooltip>
    );
  if (state?.phase === "done")
    return (
      <span className="shrink-0 text-xs text-muted-foreground-2">imported</span>
    );
  if (session.imported)
    return (
      <span className="shrink-0 text-xs text-muted-foreground-3">imported</span>
    );
  if (session.updatable)
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="shrink-0 text-xs text-muted-foreground-2">
              updated
            </span>
          }
        />
        <TooltipContent>
          Imported before, with new activity since
        </TooltipContent>
      </Tooltip>
    );
  return (
    <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
      {formatEndedAt(session.endedAt)}
    </span>
  );
}

export function SessionRow({
  session,
  state,
  busy,
  selected,
  onSelect,
}: SessionRowProps) {
  const shift = useRef(false);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the row checkbox is the keyboard control
    // biome-ignore lint/a11y/noStaticElementInteractions: the row checkbox is the keyboard control
    <div
      data-selected={selected ? "" : undefined}
      onClick={(event) => {
        if (session.imported || busy) return;
        if (
          event.target instanceof Element &&
          event.target.closest('[role="checkbox"], input')
        )
          return;
        onSelect(event.shiftKey);
      }}
      className={cx(
        ROW_CLASS,
        "group/row ml-6 select-none",
        session.imported
          ? "text-muted-foreground-2"
          : "cursor-pointer hover:bg-section",
      )}
    >
      {session.imported ? (
        <span className="size-4 shrink-0" />
      ) : (
        <Checkbox
          aria-label={selected ? "Deselect session" : "Select session"}
          checked={selected}
          disabled={busy}
          onPointerDown={(event) => {
            shift.current = event.shiftKey;
          }}
          onKeyDown={(event) => {
            shift.current = event.shiftKey;
          }}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() => {
            onSelect(shift.current);
            shift.current = false;
          }}
        />
      )}
      <SourceIcon
        source={session.source}
        className={cx(
          "size-(--icon-sm) shrink-0",
          session.imported ? "text-muted-foreground-3" : "text-icon-muted",
        )}
      />
      <span
        className={cx(
          "min-w-0 flex-1 truncate",
          session.imported ? "text-muted-foreground-2" : "text-foreground",
        )}
      >
        {session.title}
      </span>
      <SessionStatus session={session} state={state} />
    </div>
  );
}

export function ReviewSkeletonRow({ index }: { index: number }) {
  return (
    <div className={cx(ROW_CLASS, index === 0 ? "" : "ml-6")}>
      <div className="size-4 rounded-(--radius-sm) bg-secondary" />
      <div
        className={cx(
          "h-3 rounded bg-secondary",
          index === 0 ? "w-32" : "w-56",
        )}
      />
      <div className="ml-auto h-3 w-10 rounded bg-secondary" />
    </div>
  );
}
