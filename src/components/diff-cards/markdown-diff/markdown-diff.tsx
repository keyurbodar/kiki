import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type MarkdownDiffFile = {
  path: string;
  kind?: "added" | "modified" | "deleted";
  generated?: boolean;
  additions?: number;
  deletions?: number;
  patch?: string | null;
};

export type PatchlessCardProps = {
  file: MarkdownDiffFile;
  collapsed: boolean;
  generated?: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  actions?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
};

const cardClassName =
  "overflow-hidden rounded-(--radius-card) [&:not(:first-child)]:mt-2";

const headerClassName =
  "flex h-9 items-center gap-1.5 border-b-hairline border-border-1 bg-card pr-3 pl-1.5";

/** A diff card with no patch: the header still shows path, stats and actions. */
export function PatchlessCard({
  file,
  collapsed,
  generated,
  onCollapsedChange,
  actions,
  trailing,
  children,
}: PatchlessCardProps) {
  const dimmed = generated === true;
  const dimmedClassName = dimmed
    ? "text-muted-foreground-3 [&_span]:text-muted-foreground-3"
    : undefined;
  const slash = file.path.lastIndexOf("/");
  return (
    <div data-patchless-card className={cardClassName}>
      <div
        data-patchless-header
        className={cx(headerClassName, dimmedClassName)}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={collapsed ? "Expand file" : "Collapse file"}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <Icon
            name={
              collapsed
                ? "chevron-grabber-vertical-toward"
                : "chevron-grabber-vertical"
            }
          />
        </Button>
        <Icon name="file-text" className="shrink-0" />
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0 whitespace-nowrap text-foreground">
            {file.path.slice(slash + 1)}
          </span>
          <span className="min-w-0 truncate text-muted-foreground-2">
            {file.path.slice(0, slash + 1)}
          </span>
        </span>
        <span className="min-w-0 flex-1" />
        {actions}
        {generated === true ? (
          <span className="shrink-0 text-sm text-muted-foreground-2">
            generated
          </span>
        ) : null}
        {file.kind !== undefined && file.kind !== "modified" ? (
          <span className="shrink-0 text-sm text-muted-foreground-2">
            {file.kind}
          </span>
        ) : null}
        <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums">
          <span
            className={dimmed ? "text-muted-foreground-3" : "text-diff-add"}
          >
            +{file.additions ?? 0}
          </span>
          {(file.deletions ?? 0) > 0 ? (
            <span
              className={dimmed ? "text-muted-foreground-3" : "text-diff-del"}
            >
              -{file.deletions}
            </span>
          ) : null}
        </span>
        {trailing}
      </div>
      {!collapsed ? children : null}
    </div>
  );
}

export function PreviewModeButtons({
  rendered,
  onRenderedChange,
}: {
  rendered: boolean;
  onRenderedChange: (rendered: boolean) => void;
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Rendered"
              data-selected={rendered ? "" : undefined}
              onClick={() => onRenderedChange(true)}
            >
              <Icon name="eye-open" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Rendered</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Source"
              data-selected={!rendered ? "" : undefined}
              onClick={() => onRenderedChange(false)}
            >
              <Icon name="code-brackets" />
            </Button>
          }
        />
        <TooltipContent side="bottom">Source</TooltipContent>
      </Tooltip>
    </>
  );
}

export type MarkdownDiffProps = {
  file: MarkdownDiffFile;
  rendered: boolean;
  onRenderedChange: (rendered: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  actions?: ReactNode;
  patch?: ReactNode;
};

export function MarkdownDiff({
  file,
  rendered,
  onRenderedChange,
  collapsed,
  onCollapsedChange,
  actions,
  patch,
}: MarkdownDiffProps) {
  return (
    <PatchlessCard
      file={file}
      collapsed={collapsed}
      generated={file.generated}
      onCollapsedChange={onCollapsedChange}
      actions={actions}
      trailing={
        <PreviewModeButtons
          rendered={rendered}
          onRenderedChange={onRenderedChange}
        />
      }
    >
      {patch}
    </PatchlessCard>
  );
}
