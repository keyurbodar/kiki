import type { SVGProps } from "react";
import type { PullState } from "@/features/pulls/pulls-page/data/pull";
import { Icon } from "@/primitives/icon";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children" | "name">;

export function PullRequestGlyph(props: GlyphProps) {
  return <Icon name="pull-request" size="sm" {...props} />;
}

export function PullDraftGlyph(props: GlyphProps) {
  return <Icon name="draft" size="sm" {...props} />;
}

export function PullMergedGlyph(props: GlyphProps) {
  return <Icon name="merged" size="sm" {...props} />;
}

export function PullFailedGlyph(props: GlyphProps) {
  return <Icon name="shield-crossed" size="sm" {...props} />;
}

export function PullClosedGlyph(props: GlyphProps) {
  return <Icon name="request-closed" size="sm" {...props} />;
}

export function FilterGlyph(props: GlyphProps) {
  return <Icon name="filter-1" size="sm" {...props} />;
}

export function PlusGlyph(props: GlyphProps) {
  return <Icon name="plus-large" size="sm" {...props} />;
}

export function SearchGlyph(props: GlyphProps) {
  return <Icon name="magnifying-glass" size="sm" {...props} />;
}

export function ChevronDownGlyph(props: GlyphProps) {
  return <Icon name="chevron-down-small" size="sm" {...props} />;
}

export function CheckGlyph(props: GlyphProps) {
  return <Icon name="checkmark-1" size="sm" {...props} />;
}

export function BranchGlyph(props: GlyphProps) {
  return <Icon name="branch-simple" size="sm" {...props} />;
}

export function ProjectGlyph(props: GlyphProps) {
  return <Icon name="box-2" size="sm" {...props} />;
}

export function AuthorGlyph(props: GlyphProps) {
  return <Icon name="user-edit" size="sm" {...props} />;
}

export function ThreadGlyph(props: GlyphProps) {
  return <Icon name="list-bullets" size="sm" {...props} />;
}

export function CalendarGlyph(props: GlyphProps) {
  return <Icon name="calendar-4" size="sm" {...props} />;
}

export function CalendarClockGlyph(props: GlyphProps) {
  return <Icon name="calendar-clock-4" size="sm" {...props} />;
}

export function GroupingGlyph(props: GlyphProps) {
  return <Icon name="dot-grid-1x3-horizontal" size="sm" {...props} />;
}

export function DisplayGlyph(props: GlyphProps) {
  return <Icon name="settings-slider-three" size="sm" {...props} />;
}

export function CrossGlyph(props: GlyphProps) {
  return <Icon name="cross-medium" size="sm" {...props} />;
}

export function ChevronRightGlyph(props: GlyphProps) {
  return <Icon name="chevron-right-small" size="sm" {...props} />;
}

const stateGlyphs: Record<
  PullState,
  { Icon: (props: GlyphProps) => React.ReactNode; className: string }
> = {
  ready: { Icon: PullRequestGlyph, className: "text-success" },
  pending: { Icon: PullRequestGlyph, className: "text-warning-fg" },
  draft: { Icon: PullDraftGlyph, className: "text-muted-foreground-2" },
  merged: { Icon: PullMergedGlyph, className: "text-complete" },
  failed: { Icon: PullFailedGlyph, className: "text-destructive" },
  closed: { Icon: PullClosedGlyph, className: "text-destructive" },
};

export function PullStateIcon({
  state,
  className,
  ...props
}: GlyphProps & { state: PullState }) {
  const { Icon: StateIcon, className: tone } = stateGlyphs[state];
  return (
    <StateIcon
      className={["size-3 shrink-0", tone, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
