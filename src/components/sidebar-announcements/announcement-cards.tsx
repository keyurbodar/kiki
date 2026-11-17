import { useState } from "react";
import type { AnnouncementDefinition } from "@/components/release";
import { CrossMediumIcon } from "@/components/release";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";

const dismissButton = (onDismiss: () => void) => (
  <Button
    data-track-owner="shared/sidebar-announcements.tsx#AnnouncementCard:Button[Dismiss announcement]"
    variant="bare"
    size="icon-shrink"
    aria-label="Dismiss announcement"
    onClick={(event) => {
      event.stopPropagation();
      onDismiss();
    }}
    className="relative -mt-0.5 -mr-1 shrink-0 p-1 opacity-0 transition-opacity duration-hover group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
  >
    <CrossMediumIcon />
  </Button>
);

export type ReleasePlainCardProps = {
  title: string;
  meta: string;
  summary?: string;
  onOpen: () => void;
  onDismiss: () => void;
};

export function ReleasePlainCard({
  title,
  meta,
  summary,
  onOpen,
  onDismiss,
}: ReleasePlainCardProps) {
  return (
    <Card
      variant="interactive"
      className="group relative flex flex-col rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card px-2.5 py-2 shadow-card select-none transition-colors duration-hover hover:bg-card-hover"
    >
      <button
        data-track-owner="shared/sidebar-announcements.tsx#ReleasePlainCard:button[onClick=onOpen]"
        type="button"
        onClick={onOpen}
        className="absolute inset-0 cursor-pointer rounded-(--radius-card) outline-none focus-visible:outline-ring-inset"
        aria-label={title}
      />
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
          <span className="truncate text-2xs text-muted-foreground-2">
            {meta}
          </span>
        </div>
        {dismissButton(onDismiss)}
      </div>
      {summary !== undefined && (
        <span className="truncate pt-1 text-xs leading-snug text-muted-foreground-1">
          {summary}
        </span>
      )}
    </Card>
  );
}

export type AnnouncementCardProps = {
  title: string;
  meta: string;
  visual: NonNullable<AnnouncementDefinition["visual"]>;
  onOpen: () => void;
  onDismiss: () => void;
};

export function AnnouncementCard({
  title,
  meta,
  visual: Visual,
  onOpen,
  onDismiss,
}: AnnouncementCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <Card
      variant="interactive"
      className="group relative flex flex-col gap-1.5 rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card p-1.5 shadow-card select-none transition-colors duration-hover hover:bg-card-hover"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button
        data-track-owner="shared/sidebar-announcements.tsx#AnnouncementCard:button[onClick=onOpen]"
        type="button"
        onClick={onOpen}
        className="absolute inset-0 cursor-pointer rounded-(--radius-card) outline-none focus-visible:outline-ring-inset"
        aria-label={title}
      />
      <Visual
        size="card"
        animate={hover}
        className="aspect-[2] w-full rounded-(--radius) border-hairline border-border-2 shadow-plate"
      />
      <div className="flex items-start gap-2 px-1 pb-0.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
          <span className="truncate text-2xs text-muted-foreground-2">
            {meta}
          </span>
        </div>
        {dismissButton(onDismiss)}
      </div>
    </Card>
  );
}
