import type { GuideChapter, GuideFile } from "@/components/guide";
import { repoName } from "@/features/pulls/pulls-page/data/pull";

/**
 * The guide the tab renders. Capy's document is a summary with chapters, each
 * naming the files it covers; the client walks the pull's diff to fill in the
 * per-file counts, so this carries the paths and leaves the counts at zero.
 */
export type PullGuide =
  | { readonly status: "loading" }
  | { readonly status: "generating" }
  | { readonly status: "empty" }
  | { readonly status: "failed" }
  | {
      readonly status: "ready";
      readonly overview: string;
      readonly chapters: ReadonlyArray<GuideChapter>;
    };

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const text = (value: unknown) => (typeof value === "string" ? value : "");

const paths = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (typeof item === "string") return [item];
        const path = record(item)?.path;
        return typeof path === "string" ? [path] : [];
      })
    : [];

const fileOf = (path: string): GuideFile => ({
  path,
  additions: 0,
  deletions: 0,
});

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const chapterOf = (value: unknown, index: number): GuideChapter | undefined => {
  const fields = record(value);
  if (fields === undefined) return undefined;
  const title = text(fields.title);
  if (title === "") return undefined;
  const id = text(fields.id) === "" ? slug(title) : text(fields.id);
  return {
    id: id === "" ? `chapter-${index}` : id,
    title,
    explanation: text(fields.explanation),
    files: paths(fields.files).map(fileOf),
    related: [],
  };
};

/** Reads Capy's guide document into the body's chapters and empty state. */
export const decodePullGuide = (value: unknown): PullGuide => {
  const fields = record(value);
  if (fields === undefined) return { status: "failed" };
  const state = text(fields.state);
  if (state === "generating") return { status: "generating" };
  if (state === "failed") return { status: "failed" };
  const groups = Array.isArray(fields.groups) ? fields.groups : [];
  const chapters = groups.flatMap((group, index) => {
    const chapter = chapterOf(group, index);
    return chapter === undefined ? [] : [chapter];
  });
  if (chapters.length === 0) return { status: "empty" };
  return {
    status: "ready",
    overview: text(fields.overview),
    chapters,
  };
};

/** The pull's short label, used in the guide's header line. */
export const guidePullLabel = (repo: string, number: number) =>
  `${repoName(repo)}#${number}`;
