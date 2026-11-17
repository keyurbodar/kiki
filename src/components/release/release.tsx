import { useRef, useState } from "react";
import { Button } from "@/primitives/button";
import { DialogContent, DialogTitle } from "@/primitives/dialog";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import type {
  AnnouncementDefinition,
  AnnouncementDialogProps,
} from "./announcement";
import { AnnouncementHighlights } from "./announcement-highlights";
import {
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BrowserTabsIcon,
  ChainLink1Icon,
  ChevronLeftSmallIcon,
  ChevronRightSmallIcon,
  GlobeIcon,
  ImportIcon,
  MacbookIcon,
  MoonIcon,
  Plugin1Icon,
  PullRequestIcon,
  RotateIcon,
  WindowAppIcon,
} from "./icons";
import { ReleaseArtwork } from "./release-visual";
import {
  formatReleaseVersion,
  type Release,
  type ReleaseIcon,
  releaseDate,
  releaseHistory,
} from "./releases";

const highlightIcons = {
  bell: BellIcon,
  "pull-request": PullRequestIcon,
  "chain-link": ChainLink1Icon,
  tabs: BrowserTabsIcon,
  window: WindowAppIcon,
  rotate: RotateIcon,
  plug: Plugin1Icon,
  transfer: ArrowLeftRightIcon,
  moon: MoonIcon,
  laptop: MacbookIcon,
  globe: GlobeIcon,
  import: ImportIcon,
} satisfies Record<ReleaseIcon, unknown>;

const cardDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const dialogDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export type ReleaseDialogBodyProps = {
  history: ReadonlyArray<Release>;
  initial: string;
  onGotIt: () => void;
};

export function ReleaseDialogBody({
  history,
  initial,
  onGotIt,
}: ReleaseDialogBodyProps) {
  const [version, setVersion] = useState(initial);
  const header = useRef<HTMLDivElement>(null);
  const gotIt = useRef<HTMLButtonElement>(null);
  const index = history.findIndex((release) => release.version === version);
  const release = history[index];
  if (release === undefined) return null;
  const previous = history[index + 1];
  const next = index > 0 ? history[index - 1] : undefined;
  const show = (target: Release, atEdge: boolean) => {
    setVersion(target.version);
    header.current?.parentElement?.scrollTo({ top: 0 });
    if (atEdge) gotIt.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <ScrollArea className="flex flex-col [--scroll-fade-surface:var(--popover)]">
        <ScrollAreaViewport className="flex h-auto min-h-0 flex-1 flex-col p-4 pb-0">
          {release.visual !== undefined && (
            <ReleaseArtwork
              key={release.version}
              visual={release.visual}
              animate
              className="w-full shrink-0 rounded-(--radius-card) border-hairline border-border-2 shadow-card"
              style={{
                aspectRatio: `${release.visual.width} / ${release.visual.height}`,
              }}
            />
          )}
          <div
            ref={header}
            className={[
              "flex items-baseline gap-2 self-start px-1",
              release.visual !== undefined && "pt-4",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <DialogTitle className="text-left">
              Capy {formatReleaseVersion(release.version)}
            </DialogTitle>
            <span className="text-xs text-muted-foreground-2">
              {dialogDate.format(releaseDate(release))}
            </span>
          </div>
          <span className="px-1 pt-0.5 text-sm text-muted-foreground-1">
            {release.title}
          </span>
          <AnnouncementHighlights
            items={release.card.highlights.map((highlight) => ({
              icon: highlightIcons[highlight.icon],
              lead: highlight.lead,
              body: highlight.body,
            }))}
          />
        </ScrollAreaViewport>
      </ScrollArea>
      <div className="flex shrink-0 flex-col gap-2 px-5 pt-4 pb-4">
        <Button
          data-track-owner="shared/announcements/release.tsx#ReleaseDialogBody:Button[Got it]"
          ref={gotIt}
          intent="accent"
          size="base"
          className="w-full"
          onClick={onGotIt}
        >
          Got it
        </Button>
        <div className="flex items-center justify-between">
          <Button
            data-track-owner="shared/announcements/release.tsx#ReleaseDialogBody:Button.1"
            variant="ghost"
            size="sm"
            disabled={previous === undefined}
            aria-label={
              previous === undefined
                ? undefined
                : `Previous release, ${formatReleaseVersion(previous.version)}`
            }
            onClick={() =>
              previous !== undefined &&
              show(previous, index + 2 === history.length)
            }
          >
            <ChevronLeftSmallIcon />
            {previous === undefined
              ? "Previous"
              : formatReleaseVersion(previous.version)}
          </Button>
          <Button
            data-track-owner="shared/announcements/release.tsx#ReleaseDialogBody:Button[All releases]"
            variant="ghost"
            size="sm"
            render={
              <a
                data-track-owner="shared/announcements/release.tsx#ReleaseDialogBody:a.1"
                href="https://capy.ai/changelog"
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            All releases
            <ArrowUpRightIcon />
          </Button>
          <Button
            data-track-owner="shared/announcements/release.tsx#ReleaseDialogBody:Button.2"
            variant="ghost"
            size="sm"
            disabled={next === undefined}
            aria-label={
              next === undefined
                ? undefined
                : `Next release, ${formatReleaseVersion(next.version)}`
            }
            onClick={() => next !== undefined && show(next, index === 1)}
          >
            {next === undefined ? "Next" : formatReleaseVersion(next.version)}
            <ChevronRightSmallIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

export type ReleaseDialogProps = {
  history: ReadonlyArray<Release>;
  version: string;
  onGotIt: () => void;
};

export function ReleaseDialog({
  history,
  version,
  onGotIt,
}: ReleaseDialogProps) {
  return (
    <DialogContent className="overflow-hidden" initialFocus={false}>
      <ReleaseDialogBody
        history={history}
        initial={version}
        onGotIt={onGotIt}
      />
    </DialogContent>
  );
}

export function releaseAnnouncement(release: Release): AnnouncementDefinition {
  const title = `Capy ${formatReleaseVersion(release.version)}`;
  const dialog = ({ onClick }: AnnouncementDialogProps) => (
    <ReleaseDialog
      history={releaseHistory(release.version)}
      version={release.version}
      onGotIt={onClick}
    />
  );
  const visual = release.visual;
  if (visual === undefined)
    return {
      title,
      meta: cardDate.format(releaseDate(release)),
      summary: release.title,
      dialog,
    };
  return {
    title,
    meta: release.title,
    visual: ({ animate, className }) => (
      <ReleaseArtwork
        visual={visual}
        animate={animate}
        className={["block object-cover", className].filter(Boolean).join(" ")}
      />
    ),
    dialog,
  };
}
