import { type ReactNode, useState } from "react";
import { ChevronDownSmallGlyph, cx } from "@/components/review-mode";
import {
  ReviewSection,
  type ReviewSectionProps,
} from "@/components/review-section";
import { ShowMeCard, type ShowMeView } from "@/components/show-me";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import { Icon } from "@/primitives/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import "./guide.css";
import {
  chapterDomId,
  chapterNumbering,
  type GuideChapter,
  type GuideFile,
  hiddenChapterId,
  overviewChapterId,
  splitPath,
} from "./model";

export type GuideReviewButtonProps = Omit<ReviewSectionProps, "collapsible">;

export function GuideReviewButton(props: GuideReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const openCount =
    props.review?.findings.filter((finding) => finding.status === "open")
      .length ?? 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-track-owner="shared/pull-view/guide.tsx#GuideReviewButton:PopoverTrigger.1"
        render={
          <Button
            data-track-owner="shared/pull-view/guide.tsx#GuideReviewButton:Button[Capy Review]"
            size="sm"
            aria-label="Capy Review"
            className={cx(
              "hidden @lg/pull:inline-flex",
              openCount === 0 &&
                "@max-4xl/pull:w-(--h-control-sm) @max-4xl/pull:px-0",
            )}
          >
            <span
              data-slot="button-icon"
              className={cx(
                "inline-flex shrink-0 items-center justify-center -ml-0.5",
                openCount === 0 && "@max-4xl/pull:mx-0",
              )}
            >
              <Icon name="review" size="sm" />
            </span>
            <span className="hidden @4xl/pull:inline">Capy Review</span>
            {openCount > 0 && (
              <span className="text-muted-foreground-3 tabular-nums">
                {openCount}
              </span>
            )}
            <ChevronDownSmallGlyph className="hidden @4xl/pull:inline" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="flex max-h-[min(36rem,70dvh)] w-80 flex-col p-3"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReviewSection
            {...props}
            collapsible={false}
            onOpenFinding={(finding) => {
              setOpen(false);
              props.onOpenFinding?.(finding);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type GuideBodyProps = {
  readonly chapters: ReadonlyArray<GuideChapter>;
  /** The pull header drawn above the first chapter. */
  readonly header?: ReactNode;
  /** Before/after views shown in the overview chapter. */
  readonly overviewViews?: ReadonlyArray<ShowMeView>;
  readonly compact?: boolean;
  /** Paths whose diff is collapsed. */
  readonly collapsed: ReadonlySet<string>;
  /** Paths already marked viewed. */
  readonly viewed?: ReadonlySet<string>;
  readonly defaultReviewed?: ReadonlyArray<string>;
  readonly onCollapseFiles: (
    paths: ReadonlyArray<string>,
    collapsed: boolean,
  ) => void;
  readonly onOpenFile: (path: string) => void;
  readonly onLandLine?: (
    path: string,
    line: number,
    side: "additions" | "deletions",
  ) => void;
  readonly onChapterReviewed?: (position: number, reviewed: boolean) => void;
  /** Diff cards come from the diff-cards package. */
  readonly renderFile: (file: GuideFile, collapsed: boolean) => ReactNode;
};

export function GuideBody({
  chapters,
  header,
  overviewViews,
  compact = false,
  collapsed,
  viewed,
  defaultReviewed = [],
  onCollapseFiles,
  onOpenFile,
  onLandLine,
  onChapterReviewed,
  renderFile,
}: GuideBodyProps) {
  const [reviewed, setReviewed] = useState(
    () => new Set<string>(defaultReviewed),
  );
  const [, setHint] = useState<string | null>(null);
  const numbering = chapterNumbering(chapters);

  const jumpTo = (chapter: GuideChapter | undefined) => {
    if (chapter === undefined) return;
    document
      .getElementById(chapterDomId(chapter.id))
      ?.scrollIntoView({ block: "start" });
  };

  const markReviewed = (index: number, checked: boolean) => {
    const chapter = chapters[index];
    if (chapter === undefined) return;
    const next = new Set(reviewed);
    if (checked) next.add(chapter.id);
    else next.delete(chapter.id);
    setReviewed(next);
    if (checked) onChapterReviewed?.(index + 1, true);
    onCollapseFiles(
      chapter.files.map((file) => file.path),
      checked,
    );
    if (checked) jumpTo(chapters[index + 1]);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col transition-opacity duration-fast ease-out-quint motion-safe:starting:opacity-0 motion-reduce:transition-none">
      <ScrollArea className="pull-guide min-h-0 flex-1 [&_[data-diff-file]]:scroll-mt-3 [--scroll-area-inset:var(--spacing)]">
        <ScrollAreaViewport className="[overflow-anchor:none]">
          <div className="relative">
            <div
              className={cx(
                "flex flex-col px-3 pb-3",
                chapters.length > 0 && (compact ? "pl-8" : "pl-12"),
              )}
            >
              {header !== undefined && (
                <div className="pt-5 pb-3">{header}</div>
              )}
              {chapters.map((chapter, index) => {
                const overview = chapter.id === overviewChapterId;
                const hidden = chapter.id === hiddenChapterId;
                const domId = chapterDomId(chapter.id);
                return (
                  <section
                    key={chapter.id}
                    id={domId}
                    aria-labelledby={`${domId}-title`}
                    className="flex flex-col gap-4 pt-3 pb-9 @4xl/pull:flex-row @4xl/pull:gap-8"
                  >
                    <aside className="shrink-0 @4xl/pull:w-80">
                      <div className="pull-guide-chapter flex flex-col gap-4 pt-2 pb-3 @4xl/pull:sticky @4xl/pull:top-3">
                        <div className="flex flex-col gap-1.5">
                          <h2
                            id={`${domId}-title`}
                            className={cx(
                              "text-lg font-medium break-words",
                              hidden
                                ? "text-muted-foreground-3"
                                : "text-foreground",
                            )}
                          >
                            {chapter.title}
                          </h2>
                          {!overview && (
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-muted-foreground-3 tabular-nums">
                                {numbering.position(index)}
                                {hidden &&
                                  ` · ${chapter.files.length} ${chapter.files.length === 1 ? "file" : "files"}`}
                              </span>
                              {/* biome-ignore lint/a11y/noLabelWithoutControl: the checkbox renders inside the label */}
                              <label
                                className={cx(
                                  "flex cursor-pointer items-center gap-1.5 select-none",
                                  hidden
                                    ? "text-muted-foreground-3"
                                    : "text-muted-foreground-2",
                                )}
                              >
                                <Checkbox
                                  data-track="guided_review.chapter_reviewed"
                                  data-track-index={index + 1}
                                  checked={reviewed.has(chapter.id)}
                                  onCheckedChange={(checked) =>
                                    markReviewed(index, checked)
                                  }
                                />
                                Reviewed
                              </label>
                            </div>
                          )}
                        </div>
                        {!hidden && chapter.explanation !== "" && (
                          <p className="text-sm text-muted-foreground-1">
                            {chapter.explanation}
                          </p>
                        )}
                        {!hidden &&
                          !compact &&
                          chapter.files.length + chapter.related.length > 0 && (
                            <ul
                              className="-mx-2 flex flex-col"
                              aria-label="Files in this chapter"
                            >
                              {[
                                ...chapter.files.map((file) => ({
                                  file,
                                  home: undefined as number | undefined,
                                })),
                                ...chapter.related,
                              ].map(({ file, home }, position) => {
                                const { name, dir } = splitPath(file.path);
                                const isViewed =
                                  viewed?.has(file.path) ?? false;
                                const muted =
                                  collapsed.has(file.path) ||
                                  home !== undefined;
                                return (
                                  <li key={file.path}>
                                    <button
                                      data-track="guided_review.open_file"
                                      data-track-index={position + 1}
                                      type="button"
                                      title={
                                        home === undefined
                                          ? file.path
                                          : `${file.path} · chapter ${numbering.number(home)}`
                                      }
                                      onClick={() => onOpenFile(file.path)}
                                      className="flex h-7 w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-xs outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset"
                                    >
                                      <Icon name="file-text" size="xs" />
                                      <span
                                        className={cx(
                                          "shrink-0 text-foreground",
                                          muted && "text-muted-foreground-2",
                                          isViewed && "text-muted-foreground-3",
                                        )}
                                      >
                                        {name}
                                      </span>
                                      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap text-muted-foreground-3">
                                        {dir}
                                      </span>
                                      {home !== undefined && (
                                        <span className="flex shrink-0 items-center gap-1 text-muted-foreground-3 tabular-nums">
                                          {numbering.number(home)}
                                        </span>
                                      )}
                                      <span className="flex shrink-0 items-center gap-1 tabular-nums">
                                        {(file.additions ?? 0) > 0 && (
                                          <span
                                            className={
                                              isViewed
                                                ? "text-muted-foreground-3"
                                                : "text-diff-add"
                                            }
                                          >
                                            +{file.additions}
                                          </span>
                                        )}
                                        {(file.deletions ?? 0) > 0 && (
                                          <span
                                            className={
                                              isViewed
                                                ? "text-muted-foreground-3"
                                                : "text-diff-del"
                                            }
                                          >
                                            −{file.deletions}
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                      </div>
                    </aside>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 pr-(--diff-marker-gutter)">
                      {overview &&
                        overviewViews !== undefined &&
                        overviewViews.length > 0 && (
                          <div className="@4xl/pull:mt-1">
                            <ShowMeCard
                              views={overviewViews}
                              compact={compact}
                              chapterOf={(path) =>
                                numbering.chapterOf.get(path)
                              }
                              onOpenFile={onOpenFile}
                              onLand={(path, line, side) =>
                                onLandLine?.(path, line, side)
                              }
                              onHint={setHint}
                            />
                          </div>
                        )}
                      {chapter.files.map((file) => (
                        <div
                          key={file.path}
                          className="flex min-w-0 flex-col gap-3"
                        >
                          {renderFile(file, collapsed.has(file.path))}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
