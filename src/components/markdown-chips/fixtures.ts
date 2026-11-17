import type {
  ChipIssue,
  ChipPull,
  ChipTask,
  ChipThread,
  MarkdownChipsContextValue,
} from "./context";
import { pullKey } from "./context";

/** Neutral sample data for tests and the chips preview (Acme only). */
export const samplePulls: ChipPull[] = [
  {
    repo: "acme/web",
    number: 42,
    state: "ready",
    title: "web: keep the composer draft across reloads",
    additions: 49,
    deletions: 1,
    author: "Alex Morgan",
  },
  {
    repo: "acme/web",
    number: 38,
    state: "merged",
    title: "web: lazy-load the settings pages",
    additions: 120,
    deletions: 64,
    author: "Sam Lee",
  },
  {
    repo: "acme/api",
    number: 7,
    state: "failed",
    title: "api: retry webhook deliveries with backoff",
    additions: 18,
    deletions: 3,
    author: "Alex Morgan",
  },
];

export const sampleThreads: ChipThread[] = [
  {
    id: "jam_sample_01",
    code: "ACME-12",
    title: "Fix flaky sign-in redirect",
    status: "working",
    projectId: "prj_acme",
    modelLabel: "Claude Opus 5.5",
  },
  {
    id: "jam_sample_02",
    code: "ACME-9",
    title: "Audit bundle size",
    status: "idle",
    archived: true,
    projectId: "prj_acme",
    modelLabel: "Claude Opus 5.5",
  },
];

export const sampleTasks: ChipTask[] = [
  {
    id: "task_sample_03",
    localIndex: 3,
    title: "Write the retry tests",
    status: "working",
    queuedSince: null,
    lastActivityAt: "2026-11-17T09:00:00.000Z",
    createdAt: "2026-11-17T08:00:00.000Z",
  },
];

export const sampleIssues: ChipIssue[] = [
  {
    code: "ISS-4",
    title: "Composer loses the draft after a reload",
    status: "in_progress",
    priority: "high",
    visibility: "shared",
    assignee: { name: "Alex Morgan" },
  },
];

export const sampleNow = Date.parse("2026-11-17T10:00:00.000Z");

export const sampleChipsContext: MarkdownChipsContextValue = {
  repository: "acme/web",
  projectId: "prj_acme",
  pullRequests: new Map(
    samplePulls.map((pull) => [pullKey(pull.repo, pull.number), pull]),
  ),
  threads: new Map(sampleThreads.map((thread) => [thread.code, thread])),
  tasks: new Map(sampleTasks.map((task) => [task.localIndex ?? 0, task])),
  issues: new Map(sampleIssues.map((issue) => [issue.code, issue])),
  openFile: () => {},
  now: () => sampleNow,
};
