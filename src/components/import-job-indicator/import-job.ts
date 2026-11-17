import { createContext, useContext, useSyncExternalStore } from "react";

export type ImportSessionRef = { source: string; sessionId: string };

export type ImportPlacement = {
  source: string;
  sessionId: string;
  projectId: string | null;
  movedToRepos?: readonly string[];
};

export type ImportJobInput = {
  orgId: string;
  userId: string;
  device?: { deviceId: string };
  placements: readonly ImportPlacement[];
};

export type ImportSessionProgress = {
  sessionId: string;
  phase: string;
  pages: number;
  events: number;
  total: number;
  detail?: string;
};

export type ImportJob<S extends ImportSessionRef = ImportSessionRef> = {
  total: number;
  done: number;
  failed: number;
  running: boolean;
  imported: readonly S[];
  input: ImportJobInput;
  progress: ReadonlyMap<string, ImportSessionProgress>;
};

export type ImportRunResult = { ok: true } | { ok: false; detail: string };

export type ImportRunner = {
  run: (input: ImportJobInput) => Promise<ImportRunResult>;
  subscribeProgress: (
    listener: (progress: ImportSessionProgress) => void,
  ) => () => void;
};

export type ImportJobStore = {
  get: () => ImportJob | undefined;
  set: (job: ImportJob | undefined) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createImportJobStore(initial?: ImportJob): ImportJobStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (job) => {
      current = job;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const importJobStore = createImportJobStore();

export const ImportJobContext = createContext<ImportJobStore>(importJobStore);

export function useImportJobStore() {
  return useContext(ImportJobContext);
}

export function useImportJob() {
  const store = useImportJobStore();
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const importProgressKey = (session: ImportSessionRef) =>
  `import:${session.source}:${session.sessionId}`;

export function importJobProgress(
  job: Pick<ImportJob, "done" | "failed" | "total">,
) {
  const settled = job.done + job.failed;
  return {
    settled,
    fraction: job.total === 0 ? 0 : Math.min(settled / job.total, 1),
  };
}

const SETTLE_GRACE = 2000;

export function startImportJob<S extends ImportSessionRef>(
  store: ImportJobStore,
  runner: ImportRunner,
  input: ImportJobInput,
  sessions: readonly S[],
) {
  const keys = new Set(sessions.map(importProgressKey));
  const settled = new Set<string>();
  let result: ImportRunResult | undefined;
  let finished = false;
  let grace: ReturnType<typeof setTimeout> | undefined;
  const previous = store.get();
  store.set({
    total: sessions.length,
    done: 0,
    failed: 0,
    running: true,
    imported: sessions,
    input,
    progress: new Map(
      previous?.input.orgId === input.orgId &&
        previous.input.userId === input.userId
        ? [...previous.progress].filter(
            ([key, progress]) => progress.phase === "done" && !keys.has(key),
          )
        : [],
    ),
  });
  const finish = () => {
    if (finished) return;
    finished = true;
    unsubscribe();
    let job = store.get();
    if (job === undefined) return;
    const missing = sessions.length - settled.size;
    if (missing > 0) {
      const progress = new Map(job.progress);
      for (const key of keys) {
        if (settled.has(key)) continue;
        progress.set(key, {
          sessionId: key,
          phase: "failed",
          pages: 0,
          events: 0,
          total: 0,
          detail:
            result !== undefined && !result.ok
              ? result.detail
              : "Import did not finish",
        });
      }
      job = { ...job, failed: job.failed + missing, progress };
    }
    store.set({ ...job, running: false });
  };
  const check = () => {
    if (result === undefined) return;
    if (result.ok && settled.size < sessions.length) {
      grace ??= setTimeout(finish, SETTLE_GRACE);
      return;
    }
    if (grace !== undefined) clearTimeout(grace);
    finish();
  };
  const unsubscribe = runner.subscribeProgress((progress) => {
    if (
      !keys.has(progress.sessionId) ||
      settled.has(progress.sessionId) ||
      (progress.phase !== "done" && progress.phase !== "failed")
    )
      return;
    settled.add(progress.sessionId);
    const job = store.get();
    if (job !== undefined)
      store.set({
        ...job,
        done: job.done + Number(progress.phase === "done"),
        failed: job.failed + Number(progress.phase === "failed"),
        progress: new Map(job.progress).set(progress.sessionId, progress),
      });
    check();
  });
  runner
    .run(input)
    .then((value) => {
      result = value;
      check();
    })
    .catch(() => {
      result = { ok: false, detail: "Import did not finish" };
      check();
    });
}
