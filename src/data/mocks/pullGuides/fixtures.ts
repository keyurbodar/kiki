import { isoMinutesAgo, pulls } from "../fixtures/world.ts";
import { pullFiles } from "../pulls/fixtures.ts";

export type GuideGroup = {
  readonly id: string;
  readonly title: string;
  readonly areas: ReadonlyArray<string>;
  readonly explanation: string;
  readonly files: ReadonlyArray<string>;
};

export type PullGuideDocument = {
  readonly id: string;
  readonly pullId: string;
  readonly state: "generating" | "completed" | "failed";
  readonly overview: string;
  readonly groups: ReadonlyArray<GuideGroup>;
  readonly generatedAt: string | null;
};

/** The files the pull's diff carries, so a chapter can mount a real card. */
const [logicFile, testFile, surfaceFile] = pullFiles;

const chapter = (
  id: string,
  title: string,
  explanation: string,
  files: ReadonlyArray<string>,
  areas: ReadonlyArray<string>,
): GuideGroup => ({ id, title, areas, explanation, files });

/** The guide a completed review pass writes, shaped as Capy's summary document. */
const completed = (pullId: string, title: string): PullGuideDocument => ({
  id: `guide_${pullId}`,
  pullId,
  state: "completed",
  overview: `${title} lands in three passes: the surface it changes, the logic behind it, and the tests that hold it down.`,
  generatedAt: isoMinutesAgo(20),
  groups: [
    chapter(
      "surface",
      "The surface",
      "The visible change: what the reader sees first and which files carry it.",
      [surfaceFile!.path],
      ["ui"],
    ),
    chapter(
      "logic",
      "The logic",
      "The behaviour behind the surface, where the interesting decisions live.",
      [logicFile!.path],
      ["data"],
    ),
    chapter(
      "tests",
      "The tests",
      "What proves it: the cases that would fail if the change were wrong.",
      [testFile!.path],
      ["tests"],
    ),
  ],
});

/** A pull whose guide is still being written, as the capture caught it. */
const generating = (pullId: string): PullGuideDocument => ({
  id: `guide_${pullId}`,
  pullId,
  state: "generating",
  overview: "",
  generatedAt: null,
  groups: [],
});

export const emptyGuide = (pullId: string): PullGuideDocument => ({
  id: `guide_${pullId}`,
  pullId,
  state: "completed",
  overview: "",
  generatedAt: isoMinutesAgo(5),
  groups: [],
});

/** Every mocked pull, so the Guide tab has a document for whichever one opens. */
export const pullGuideDocuments: ReadonlyArray<PullGuideDocument> = pulls.map(
  (pull) => {
    if (pull.state === "draft") return generating(pull.id);
    if (pull.number % 7 === 0) return emptyGuide(pull.id);
    return completed(pull.id, pull.title);
  },
);
