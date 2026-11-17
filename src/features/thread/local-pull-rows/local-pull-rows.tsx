import { cx } from "class-variance-authority";
import { type MouseEvent, type ReactNode, useState } from "react";
import { Button, ButtonIcon } from "@/primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  ArrowUpRightGlyph,
  ChevronRightSmallGlyph,
  DotGridGlyph,
  DraftGlyph,
  type GlyphProps,
  MergedGlyph,
  PullRequestGlyph,
  RequestClosedGlyph,
  RotateClockwiseGlyph,
  ShieldCrossedGlyph,
  TrashGlyph,
} from "./glyphs";
import {
  checksColor,
  connectTip,
  type DevicePullError,
  devicePullErrorText,
  type LocalPull,
  type LocalPullRowState,
  type PullState,
  repoName,
  type StatusColor,
  signInTip,
  statusDotColors,
} from "./model";

export const localPullRow =
  "flex w-full flex-col gap-0.5 rounded-(--radius) px-2 py-1.5 text-left text-sm cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";
const rowLine = "flex h-5 min-w-0 items-center gap-2";
const rowIcon = "flex size-4 shrink-0 items-center justify-center";
const rowMeta =
  "flex h-4 min-w-0 items-center gap-1.5 pl-6 text-xs text-muted-foreground-2";
const rowTitle = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
const rowLink =
  "focus-gutter flex min-w-0 items-center gap-0.5 rounded-sm text-(--text-link) cursor-pointer hover:underline underline-offset-2 focus-visible:outline-ring-inset";
const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

const pullStateIcons: Record<
  PullState,
  { Icon: (props: GlyphProps) => ReactNode; className: string }
> = {
  ready: { Icon: PullRequestGlyph, className: "text-success" },
  pending: { Icon: PullRequestGlyph, className: "text-warning-fg" },
  draft: { Icon: DraftGlyph, className: "text-muted-foreground-2" },
  merged: { Icon: MergedGlyph, className: "text-complete" },
  failed: { Icon: ShieldCrossedGlyph, className: "text-destructive" },
  closed: { Icon: RequestClosedGlyph, className: "text-destructive" },
};

export type PullStateIconProps = GlyphProps & { state: PullState };

export function PullStateIcon({
  state,
  className,
  ...props
}: PullStateIconProps) {
  const { Icon, className: tone } = pullStateIcons[state];
  return (
    <Icon
      data-state={state}
      className={cx("size-3 shrink-0", tone, className)}
      {...props}
    />
  );
}

export { PullRequestGlyph };

export type DiffStatProps = { additions: number; deletions: number };

export function DiffStat({ additions, deletions }: DiffStatProps) {
  return (
    <span data-slot="diff-stat" className="shrink-0 tabular-nums">
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </span>
  );
}

export function StatusDot({
  color = "neutral",
  className,
}: {
  color?: StatusColor;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-slot="status-dot"
      data-color={color}
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        statusDotColors[color],
        className,
      )}
    />
  );
}

export type ClusterButtonProps = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  children: ReactNode;
};

export function ClusterButton({
  label,
  onClick,
  loading,
  children,
}: ClusterButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="bare"
            size="icon-shrink"
            aria-label={label}
            aria-busy={loading || undefined}
            className="relative p-1"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              if (event.detail > 0) event.currentTarget.blur();
              onClick();
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

function DevicePullErrorLine({
  error,
  deviceNoun,
  onRetry,
  retrying,
}: {
  error: DevicePullError;
  deviceNoun: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span role="status" className="block text-xs text-muted-foreground-2">
        {devicePullErrorText(error, deviceNoun)}
      </span>
      {"failed" in error && onRetry !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          aria-busy={retrying || undefined}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            onRetry();
          }}
        >
          Retry
        </Button>
      )}
    </span>
  );
}

export type LocalPullRowViewProps = {
  pull: LocalPull;
  state: LocalPullRowState;
  recorder: string | null;
  onRemove: () => void;
  deviceNoun?: string;
};

export function LocalPullRowView({
  pull,
  state,
  recorder,
  onRemove,
  deviceNoun = "computer",
}: LocalPullRowViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const detail = state.kind === "live" ? state.detail : undefined;
  const tipText =
    state.kind === "tip"
      ? state.tip === "signin"
        ? signInTip(deviceNoun)
        : connectTip
      : undefined;

  const row = (
    <a
      data-slot="local-pull-row"
      href={pull.url}
      target="_blank"
      rel="noreferrer"
      className={localPullRow}
    >
      <span className={rowLine}>
        <span className={rowIcon}>
          {detail === undefined ? (
            <PullRequestGlyph className="size-(--icon-xs) shrink-0 text-muted-foreground-2" />
          ) : (
            <PullStateIcon state={detail.state} />
          )}
        </span>
        <span className="shrink-0 text-muted-foreground-2 tabular-nums">
          {repoName(pull.repo)}#{pull.number}
        </span>
        {detail !== undefined ? (
          <span className={cx(rowTitle, "font-medium text-foreground")}>
            {detail.title}
          </span>
        ) : state.kind === "loading" ? (
          <span className={cx(rowTitle, "flex items-center")}>
            <span className="h-3 w-44 rounded bg-secondary" />
          </span>
        ) : (
          <span className={cx(rowTitle, "text-muted-foreground-2")}>
            {pull.repo}
          </span>
        )}
      </span>
      <span className={rowMeta}>
        {detail !== undefined && (
          <>
            <span className="min-w-0 truncate tabular-nums">
              {detail.baseRefName} ← {detail.headRefName}
            </span>
            <DiffStat
              additions={detail.additions}
              deletions={detail.deletions}
            />
            {detail.checksState !== null && (
              <StatusDot color={checksColor(detail.checksState)} />
            )}
          </>
        )}
        {state.kind === "loading" && (
          <span className="h-3 w-32 rounded bg-secondary" />
        )}
        {state.kind === "tip" &&
          (state.onOpen === undefined ? (
            <span className="truncate">{tipText}</span>
          ) : (
            <button
              type="button"
              className={rowLink}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                state.onOpen?.();
              }}
            >
              <span className="truncate">{tipText}</span>
              <ChevronRightSmallGlyph className="size-3 shrink-0" />
            </button>
          ))}
        {state.kind === "plain" && (
          <span className="flex items-center gap-1">
            Open in GitHub
            <ArrowUpRightGlyph className="size-3 shrink-0" />
          </span>
        )}
      </span>
      {(state.kind === "live" || state.kind === "error") &&
        state.error !== undefined && (
          <span className="pl-6">
            <DevicePullErrorLine
              error={state.error}
              deviceNoun={deviceNoun}
              onRetry={state.onRefresh}
              retrying={state.refreshing}
            />
          </span>
        )}
    </a>
  );

  const items = (
    <>
      {recorder !== null && <MenuLabel>Recorded by {recorder}</MenuLabel>}
      <MenuLabel>No Capy callbacks until GitHub connects</MenuLabel>
      <MenuSeparator />
      {state.kind === "live" && (
        <MenuItem onClick={state.onRefresh}>
          <span className={menuIcon}>
            <RotateClockwiseGlyph />
          </span>
          Refresh
        </MenuItem>
      )}
      <MenuItem onClick={() => window.open(pull.url, "_blank", "noreferrer")}>
        <span className={menuIcon}>
          <ArrowUpRightGlyph />
        </span>
        Open in GitHub
      </MenuItem>
      <MenuItem intent="danger" onClick={onRemove}>
        <span className={menuIcon}>
          <TrashGlyph />
        </span>
        Remove
      </MenuItem>
    </>
  );

  return (
    <div className="group/row relative">
      {state.kind === "loading" ? (
        <div
          role="status"
          aria-busy
          aria-label={`Loading ${pull.repo}#${pull.number}`}
        >
          {row}
        </div>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger className="block">{row}</ContextMenuTrigger>
          <ContextMenuContent className="w-56">{items}</ContextMenuContent>
        </ContextMenu>
      )}
      <span
        className={cx(
          "mask-fade-l [--mask-fade-ramp:calc(var(--spacing)*8)] absolute inset-y-0 right-0 flex items-start rounded-r pt-1 pr-1 pl-9",
          "origin-right pointer-events-none opacity-0 transition-[opacity,scale] duration-100 motion-safe:scale-98",
          "group-hover/row:opacity-100 motion-safe:group-hover/row:scale-100",
          "has-[[data-popup-open]]:opacity-100 motion-safe:has-[[data-popup-open]]:scale-100",
          "focus-within:opacity-100 motion-safe:focus-within:scale-100",
        )}
      >
        <span aria-hidden className="absolute inset-0 rounded-r bg-panel" />
        <span aria-hidden className="absolute inset-0 rounded-r bg-secondary" />
        <span className="pointer-events-none relative flex items-center group-hover/row:pointer-events-auto has-[[data-popup-open]]:pointer-events-auto focus-within:pointer-events-auto">
          {state.kind === "live" && (
            <ClusterButton
              label="Refresh pull request"
              loading={state.refreshing}
              onClick={state.onRefresh}
            >
              <ButtonIcon>
                <RotateClockwiseGlyph />
              </ButtonIcon>
            </ClusterButton>
          )}
          <Menu open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <MenuTrigger
                    render={
                      <Button
                        variant="bare"
                        size="icon-shrink"
                        aria-label={`${pull.repo}#${pull.number} actions`}
                        className="relative p-1"
                      />
                    }
                  >
                    <DotGridGlyph />
                  </MenuTrigger>
                }
              />
              <TooltipContent side="bottom">More actions</TooltipContent>
            </Tooltip>
            <MenuContent align="end" className="w-56">
              {items}
            </MenuContent>
          </Menu>
        </span>
      </span>
    </div>
  );
}

export type LocalPullRowProps = {
  pull: LocalPull;
  onRemove: () => void;
};

export function LocalPullRow({ pull, onRemove }: LocalPullRowProps) {
  return (
    <LocalPullRowView
      pull={pull}
      state={{ kind: "loading" }}
      recorder={null}
      onRemove={onRemove}
    />
  );
}
