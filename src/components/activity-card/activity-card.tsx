import { type ReactNode, useState } from "react";
import {
  ChevronDownSmallIcon,
  ChevronRightSmallIcon,
} from "@/components/pull-view/icons";
import { relativeTime } from "@/components/pull-view/pull-model";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export const cx = (
  ...parts: ReadonlyArray<string | false | null | undefined>
) => parts.filter(Boolean).join(" ");

const track = (owner: string) => `shared/pull-view/activity-card.tsx#${owner}`;

const avatarSizes = {
  xs: "size-4 text-2xs",
  sm: "size-6 text-2xs",
  base: "size-8 text-xs",
} as const;

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof avatarSizes;
  className?: string;
};

export function Avatar({ name, src, size = "sm", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src != null && src !== "" && !failed) {
    return (
      <span
        className={cx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          avatarSizes[size],
          className,
        )}
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground",
        avatarSizes[size],
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export type CardActionProps = {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
};

export function CardAction({
  label,
  disabled = false,
  onClick,
  href,
  children,
}: CardActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        data-track-owner={track("CardAction:TooltipTrigger.1")}
        render={
          <Button
            data-track-owner={track("CardAction:Button[onClick=onClick]")}
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            render={
              href === undefined ? undefined : (
                // biome-ignore lint/a11y/useAnchorContent: the Button renders its children inside this anchor
                <a
                  data-track-owner={track("CardAction:a.1")}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                />
              )
            }
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export type CardTimeProps = { at: Date; edited?: boolean };

export function CardTime({ at, edited = false }: CardTimeProps) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-2xs whitespace-nowrap text-muted-foreground-3">
      <span>{relativeTime(at)}</span>
      {edited && (
        <>
          <span aria-hidden className="h-2.5 w-hairline shrink-0 bg-border-1" />
          <span>Edited</span>
        </>
      )}
    </span>
  );
}

export type ActivityCardProps = {
  author: string;
  identity?: ReactNode;
  avatarUrl?: string | null;
  avatar?: ReactNode;
  at: Date;
  suffix?: ReactNode;
  chip?: ReactNode;
  lead?: ReactNode;
  edited?: boolean;
  resolved?: boolean;
  outdated?: boolean;
  collapsible?: { collapsed: boolean; onToggle: () => void };
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function ActivityCard({
  author,
  identity,
  avatarUrl,
  avatar,
  at,
  suffix,
  chip,
  lead,
  edited = false,
  resolved = false,
  outdated = false,
  collapsible,
  actions,
  footer,
  className,
  children,
}: ActivityCardProps) {
  const collapsed = collapsible?.collapsed === true;
  return (
    <div
      className={cx(
        "group/card flex flex-col gap-2 rounded-(--radius-card) border-hairline border-border-1 bg-card p-3 font-sans shadow-plate",
        collapsible !== undefined && "pt-1.5",
        collapsed && "pb-1.5",
        className,
      )}
    >
      {!collapsed && lead !== undefined && (
        <div
          className={cx(
            "-mx-3 overflow-hidden rounded-t-(--radius-card) border-b-(length:--border-width-hairline) border-border-1 empty:hidden",
            collapsible === undefined ? "-mt-3" : "-mt-1.5",
          )}
        >
          {lead}
        </div>
      )}
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {identity ?? (
            <>
              <span className="flex max-w-full min-w-0 items-center gap-2">
                {avatar ?? <Avatar size="xs" name={author} src={avatarUrl} />}
                <span className="truncate text-sm font-medium text-foreground">
                  {author}
                </span>
              </span>
              {suffix !== undefined && (
                <span className="max-w-full truncate text-xs text-muted-foreground-2">
                  {suffix}
                </span>
              )}
              <CardTime at={at} edited={edited} />
            </>
          )}
          {(chip !== undefined || outdated || resolved) && (
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
              {chip}
              {outdated && (
                <Badge size="xs" color="warning" className="shrink-0">
                  Outdated
                </Badge>
              )}
              {resolved && (
                <Badge size="xs" color="success" className="shrink-0">
                  Resolved
                </Badge>
              )}
            </div>
          )}
        </div>
        {actions !== undefined && actions !== false && !collapsed && (
          <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover/card:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
            {actions}
          </span>
        )}
        {collapsible !== undefined && (
          <Button
            data-track-owner={track("ActivityCard:Button[onClick=onToggle]")}
            variant="ghost"
            size="icon-xs"
            aria-label={collapsed ? "Expand" : "Collapse"}
            aria-expanded={!collapsed}
            onClick={collapsible.onToggle}
          >
            {collapsed ? <ChevronRightSmallIcon /> : <ChevronDownSmallIcon />}
          </Button>
        )}
      </div>
      {!collapsed && children}
      {!collapsed && footer}
    </div>
  );
}
