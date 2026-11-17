export const overviewChapterId = "overview";
export const hiddenChapterId = "hidden-files";

export interface GuideFile {
  readonly path: string;
  readonly additions?: number;
  readonly deletions?: number;
}

export interface GuideChapter {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly files: ReadonlyArray<GuideFile>;
  /** Files that live in another chapter but matter here, with that chapter's index. */
  readonly related: ReadonlyArray<{
    readonly file: GuideFile;
    readonly home: number;
  }>;
}

export interface ChapterRef {
  readonly id: string;
  readonly number: string;
}

/** Chapter numbering as Capy's guide shows it: overview and hidden files take no number. */
export function chapterNumbering(chapters: ReadonlyArray<GuideChapter>) {
  const numbered = chapters.flatMap((chapter, index) =>
    chapter.id === overviewChapterId || chapter.id === hiddenChapterId
      ? []
      : [index],
  );
  const total = String(numbered.length).padStart(2, "0");
  const number = (index: number) =>
    chapters[index]?.id === hiddenChapterId
      ? "Hidden"
      : String(numbered.indexOf(index) + 1).padStart(2, "0");
  const position = (index: number) =>
    chapters[index]?.id === hiddenChapterId
      ? number(index)
      : `${number(index)} / ${total}`;
  const chapterOf = new Map<string, ChapterRef>(
    chapters.flatMap((chapter, index) =>
      chapter.id === hiddenChapterId
        ? []
        : chapter.files.map(
            (file) =>
              [file.path, { id: chapter.id, number: number(index) }] as const,
          ),
    ),
  );
  return { number, position, chapterOf };
}

export const splitPath = (path: string) => {
  const slash = path.lastIndexOf("/");
  return {
    name: path.slice(slash + 1),
    dir: slash < 0 ? "" : path.slice(0, slash + 1),
  };
};

export const chapterDomId = (id: string) => `guide-chapter-${id}`;
