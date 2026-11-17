import type { RunsIn } from "../automation-editor/model";

export const newThreadEachRun: RunsIn = {
  threadMode: "new",
  singleJamId: null,
};

export type ThreadRef = {
  id: string;
  title: string | null;
  code: string | null;
  archived: boolean;
};

export const threadCode = (
  thread: { threadNumber: number | null; projectId: string | null },
  projects: ReadonlyArray<{ id: string; code: string }>,
) => {
  const project = projects.find(
    (candidate) => candidate.id === thread.projectId,
  );
  return project === undefined || thread.threadNumber === null
    ? null
    : `${project.code}-${thread.threadNumber}`;
};

export const runsInLabel = (value: RunsIn, thread: ThreadRef | undefined) =>
  value.threadMode === "new"
    ? "New thread each run"
    : value.singleJamId === null
      ? "One standing thread"
      : (thread?.code ?? thread?.title ?? "A thread");

export const threadLabel = (value: RunsIn, thread: ThreadRef | undefined) =>
  value.singleJamId === null || thread === undefined
    ? null
    : (thread.code ?? thread.title ?? "this thread");

export const runsInDescription = (value: RunsIn, label: string | null) =>
  value.threadMode === "new"
    ? "Each run starts a new thread"
    : label === null
      ? "The first run starts a thread, and every later run continues it"
      : `Every run continues ${label}`;

export const accessDescription = (label: string, personal: boolean) =>
  personal
    ? `Only people who can see ${label} see this automation and its runs`
    : `Everyone who can see ${label} sees this automation`;

export const selectableThreads = (
  threads: ReadonlyArray<ThreadRef>,
  taken: ReadonlySet<string>,
  query: string,
) => {
  const needle = query.trim().toLowerCase();
  return threads.filter(
    (thread) =>
      !thread.archived &&
      !taken.has(thread.id) &&
      (needle === "" ||
        [thread.title ?? "", thread.code ?? ""].some((value) =>
          value.toLowerCase().includes(needle),
        )),
  );
};
