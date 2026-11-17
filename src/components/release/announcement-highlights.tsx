import type { ComponentType } from "react";
import { Markdown } from "@/components/markdown";

export type AnnouncementHighlight = {
  icon: ComponentType;
  lead: string;
  body: string;
};

export type AnnouncementHighlightsProps = {
  items: ReadonlyArray<AnnouncementHighlight>;
};

export function AnnouncementHighlights({ items }: AnnouncementHighlightsProps) {
  return (
    <ul className="flex flex-col gap-1 px-1 pt-3">
      {items.map(({ icon: HighlightIcon, lead, body }) => (
        <li
          key={lead}
          className="flex items-start gap-3 rounded-(--radius-card) p-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-4">
            <HighlightIcon />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <Markdown text={lead} variant="inline" size="sm" weight="medium" />
            <Markdown text={body} variant="inline" size="sm" tone="muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
