import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { type MouseEvent, type ReactNode, useState } from "react";
import { CircleBanGlyph } from "@/components/issue-pickers";
import type { IssueRelationRef } from "@/data/api/schemas/issue";
import { Badge } from "@/primitives/badge";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";

export type IssueRelationSide = "blockedBy" | "blocking";

export const issueRelationSides: Record<
  IssueRelationSide,
  { label: string; glyph: string }
> = {
  blockedBy: { label: "Blocked by", glyph: "text-destructive" },
  blocking: { label: "Blocking", glyph: "text-orange" },
};

/** How a click opens an issue: in the side pane, or from a collection where Cmd/Ctrl opens a new tab. */
export type IssueClickMode = "pane" | "collection";

export type OpenIssue = (code: string, newTab: boolean) => void;

const stop = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Lets a link do its own thing for Shift/Alt clicks, for Cmd/Ctrl clicks in a
 * collection, and when nobody handles opening; otherwise hands it to onOpen.
 */
export const handleIssueLinkClick = (
  event: MouseEvent,
  mode: IssueClickMode,
  onOpen: ((newTab: boolean) => void) | undefined,
) => {
  if (onOpen === undefined || event.shiftKey || event.altKey) return;
  const newTab = event.metaKey || event.ctrlKey;
  if (newTab && mode === "collection") return;
  event.preventDefault();
  onOpen(newTab);
};

function RelationRow({
  issue,
  glyph,
}: {
  issue: IssueRelationRef;
  glyph: ReactNode;
}) {
  return (
    <>
      {glyph}
      <span className="shrink-0 text-xs font-normal text-muted-foreground-2">
        {issue.code}
      </span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
        {issue.title}
      </span>
    </>
  );
}

export type IssueRelationChipProps = {
  side: IssueRelationSide;
  /** The code of the issue whose relations these are, for the overflow row. */
  subject: string;
  refs: ReadonlyArray<IssueRelationRef>;
  total: number;
  /** True when the total is a lower bound. */
  capped: boolean;
  label: string;
  count: ReactNode;
  onOpenIssue?: OpenIssue;
  clickMode?: IssueClickMode;
  /** Draws a related issue's state icon. */
  stateGlyph?: (issue: IssueRelationRef) => ReactNode;
};

/**
 * A list row's Blocked by or Blocking badge. One related issue opens on click;
 * several open a menu. Hovering previews them, with a row for the ones not loaded.
 */
export function IssueRelationChip({
  side,
  subject,
  refs,
  total,
  capped,
  label,
  count,
  onOpenIssue,
  clickMode = "pane",
  stateGlyph,
}: IssueRelationChipProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const first = refs[0];
  if (first === undefined) return null;
  const more = total - refs.length;
  const openIssue = (code: string, event: MouseEvent) => {
    const newTab = event.metaKey || event.ctrlKey;
    if (newTab && clickMode === "collection") {
      window.open(
        router.buildLocation({ to: "/issues/$code", params: { code } }).href,
        "_blank",
        "noopener",
      );
      return;
    }
    if (onOpenIssue === undefined)
      void navigate({ to: "/issues/$code", params: { code } });
    else onOpenIssue(code, newTab);
  };
  const face = (
    <>
      <CircleBanGlyph className={issueRelationSides[side].glyph} />
      <span className="whitespace-nowrap @max-md/list:hidden">{label}</span>
      <span className="hidden whitespace-nowrap tabular-nums @max-md/list:inline">
        {count}
      </span>
    </>
  );
  const rows = [
    ...refs.map((ref) => ({ code: ref.code, ref })),
    ...(more > 0 ? [{ code: subject, ref: undefined }] : []),
  ];
  const overflow = (
    <span className="text-sm font-normal text-muted-foreground-2">
      {more}
      {capped ? "+" : ""} more in {subject}
    </span>
  );
  const heading = (className: string) => (
    <div
      className={cx(className, "text-xs font-normal text-muted-foreground-2")}
    >
      {issueRelationSides[side].label}
    </div>
  );
  return (
    <PreviewCard>
      {total === 1 ? (
        <PreviewCardTrigger
          render={
            <Badge
              size="xs"
              interactive={false}
              className="shrink-0 cursor-pointer"
              data-issue-relation={side}
              aria-label={label}
              onClick={(event) => {
                stop(event);
                openIssue(first.code, event);
              }}
            />
          }
        >
          {face}
        </PreviewCardTrigger>
      ) : (
        <Menu open={open} onOpenChange={setOpen}>
          <MenuTrigger
            render={
              <PreviewCardTrigger
                render={
                  <Badge
                    size="xs"
                    className="shrink-0"
                    data-issue-relation={side}
                    aria-label={`${label}, show issues`}
                    onClick={stop}
                  />
                }
              />
            }
          >
            {face}
          </MenuTrigger>
          <MenuContent align="end" className="w-80">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: keeps menu clicks from reaching the list row */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard activation goes through the menu items */}
            <div onClick={(event) => event.stopPropagation()}>
              {heading("px-2 pt-1 pb-0.5")}
              {rows.map((row) => (
                <MenuItem
                  key={row.ref === undefined ? "more" : row.code}
                  onClick={(event) => openIssue(row.code, event)}
                >
                  {row.ref === undefined ? (
                    overflow
                  ) : (
                    <RelationRow
                      issue={row.ref}
                      glyph={stateGlyph?.(row.ref)}
                    />
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuContent>
        </Menu>
      )}
      {!open && (
        <PreviewCardContent
          side="bottom"
          align="end"
          sideOffset={6}
          className="w-80"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="-m-1.5 flex max-h-80 min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain p-0.5 md:scroll-fade-y">
            {heading("px-1.5 pt-1 pb-0.5")}
            {rows.map((row) => (
              <Link
                key={row.ref === undefined ? "more" : row.code}
                to="/issues/$code"
                params={{ code: row.code }}
                onClick={(event) =>
                  handleIssueLinkClick(
                    event,
                    clickMode,
                    onOpenIssue === undefined
                      ? undefined
                      : (newTab) => onOpenIssue(row.code, newTab),
                  )
                }
                className={cx(
                  "flex items-center gap-2 rounded px-1.5 py-1 outline-none select-none",
                  "hover:bg-popover-hover focus-visible:outline-ring-inset",
                )}
              >
                {row.ref === undefined ? (
                  overflow
                ) : (
                  <RelationRow issue={row.ref} glyph={stateGlyph?.(row.ref)} />
                )}
              </Link>
            ))}
          </div>
        </PreviewCardContent>
      )}
    </PreviewCard>
  );
}
