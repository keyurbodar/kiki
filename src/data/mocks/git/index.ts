import { DateTime, Effect, Ref } from "effect";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type GitFile,
  type GitThreadState,
  gitFileSize,
  initialGitStates,
  treeEntries,
} from "./fixtures.ts";

const queryValue = (query: Record<string, unknown>, key: string) => {
  const value = query[key];
  if (Array.isArray(value)) return value[0];
  return value;
};

const queryText = (query: Record<string, unknown>, key: string) => {
  const value = queryValue(query, key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const pathFrom = (input: Record<string, unknown>) => {
  const value = queryText(input, "path") ?? queryText(input, "filePath");
  if (value === undefined) return undefined;
  return value.replace(/^\/+/, "");
};

const decodePath = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const ensureThread = (
  states: ReadonlyMap<string, GitThreadState>,
  threadId: string,
) => {
  const state = states.get(threadId);
  return state === undefined
    ? Effect.die(new Error(`GitMock: no files for thread ${threadId}`))
    : Effect.succeed(state);
};

const findFile = (state: GitThreadState, path: string) => {
  const file = state.files.find((entry) => entry.path === path);
  return file === undefined
    ? Effect.die(new Error(`GitMock: no file ${path} in thread ${state.head}`))
    : Effect.succeed(file);
};

const unifiedDiff = (path: string, before: string, after: string): string => {
  const header = `--- a/${path}\n+++ b/${path}`;
  if (before === after) return header;
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const hunks: Array<string> = [];
  let oldStart = 0;
  let newStart = 0;
  let body: Array<string> = [];
  const flush = () => {
    if (body.length === 0) return;
    const oldCount = body.filter((line) => !line.startsWith("+")).length;
    const newCount = body.filter((line) => !line.startsWith("-")).length;
    hunks.push(
      `@@ -${oldStart + 1},${oldCount} +${newStart + 1},${newCount} @@\n${body.join("\n")}`,
    );
    body = [];
  };
  const max = Math.max(oldLines.length, newLines.length);
  for (let index = 0; index < max; index++) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];
    if (oldLine === newLine) {
      if (body.length > 2) {
        flush();
        oldStart = index;
        newStart = index;
      }
      if (body.length > 0 || index === oldStart) {
        body.push(` ${oldLine ?? ""}`);
      }
    } else {
      if (oldLine !== undefined) body.push(`-${oldLine}`);
      if (newLine !== undefined) body.push(`+${newLine}`);
    }
  }
  flush();
  return `${header}\n${hunks.join("\n")}`;
};

export const GitMock = mockGroup("git", (handlers) =>
  Effect.gen(function* () {
    const { pulls } = yield* MockDb;
    const statesRef = yield* Ref.make(
      new Map<string, GitThreadState>(initialGitStates),
    );

    const updateState = (
      threadId: string,
      update: (state: GitThreadState) => GitThreadState,
    ) =>
      Effect.gen(function* () {
        const states = yield* Ref.get(statesRef);
        const current = yield* ensureThread(states, threadId);
        const next = update(current);
        yield* Ref.set(statesRef, new Map([...states, [threadId, next]]));
        return next;
      });

    const stateFor = (params: { orgId: string; jamId: string }) =>
      Effect.gen(function* () {
        if (params.orgId === "org_sample_lab") {
          return yield* Effect.die(
            new Error(`GitMock: unknown org ${params.orgId}`),
          );
        }
        const states = yield* Ref.get(statesRef);
        return yield* ensureThread(states, params.jamId);
      });

    return handlers
      .handle("blob", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          if (rawPath === undefined) {
            return yield* Effect.die(
              new Error("GitMock: blob requires a path"),
            );
          }
          const path = decodePath(rawPath);
          const file = yield* findFile(state, path);
          return {
            path: file.path,
            content: file.content,
            language: file.language,
            size: file.size,
            updatedAt: file.updatedAt,
            repo: state.repo,
            branch: state.branch,
            head: state.head,
          };
        }),
      )
      .handle("write", ({ params, payload }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const input = fields(payload);
          const rawPath =
            typeof input.path === "string"
              ? input.path
              : typeof input.filePath === "string"
                ? input.filePath
                : undefined;
          if (rawPath === undefined) {
            return yield* Effect.die(
              new Error("GitMock: write requires a path"),
            );
          }
          const path = decodePath(rawPath.replace(/^\/+/, ""));
          const content =
            typeof input.content === "string"
              ? input.content
              : input.content === undefined || input.content === null
                ? ""
                : String(input.content);
          const language =
            typeof input.language === "string"
              ? input.language
              : (state.files.find((entry) => entry.path === path)?.language ??
                (path.endsWith(".md") ? "markdown" : "text"));
          const updated: GitFile = {
            path,
            content,
            language,
            size: gitFileSize(content),
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* updateState(params.jamId, (current) => {
            const exists = current.files.some((entry) => entry.path === path);
            return {
              ...current,
              files: exists
                ? current.files.map((entry) =>
                    entry.path === path ? updated : entry,
                  )
                : [...current.files, updated],
              untracked: exists
                ? current.untracked
                : [...new Set([...current.untracked, path])],
            };
          });
          return updated;
        }),
      )
      .handle("manifest", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          const path = rawPath === undefined ? undefined : decodePath(rawPath);
          const files = path
            ? state.files.filter((entry) => entry.path.startsWith(`${path}/`))
            : state.files;
          return {
            repo: state.repo,
            branch: state.branch,
            head: state.head,
            path: path ?? null,
            files: files.map((entry) => ({
              path: entry.path,
              language: entry.language,
              size: entry.size,
              updatedAt: entry.updatedAt,
            })),
          };
        }),
      )
      .handle("patch", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          const path = rawPath === undefined ? undefined : decodePath(rawPath);
          const paths =
            path === undefined
              ? [
                  ...new Set([
                    ...state.files.map((entry) => entry.path),
                    ...state.baseline.map((entry) => entry.path),
                  ]),
                ].sort()
              : [path];
          const changed = paths.flatMap((entryPath) => {
            const current = state.files.find(
              (entry) => entry.path === entryPath,
            );
            const before = state.baseline.find(
              (entry) => entry.path === entryPath,
            );
            if (current === undefined && before === undefined) return [];
            const diff = unifiedDiff(
              entryPath,
              before?.content ?? "",
              current?.content ?? "",
            );
            return [
              {
                path: entryPath,
                additionCount: diff
                  .split("\n")
                  .filter(
                    (line) => line.startsWith("+") && !line.startsWith("+++"),
                  ).length,
                deletionCount: diff
                  .split("\n")
                  .filter(
                    (line) => line.startsWith("-") && !line.startsWith("---"),
                  ).length,
                diff,
              },
            ];
          });
          return {
            patch: changed.map((entry) => entry.diff).join("\n"),
            filesChanged: changed.length,
            files: changed,
            branch: state.branch,
          };
        }),
      )
      .handle("status", ({ params }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const changes = state.files.filter(
            (entry) =>
              entry.content !==
              state.baseline.find((before) => before.path === entry.path)
                ?.content,
          );
          const untrackedFiles = state.files.filter((entry) =>
            state.untracked.includes(entry.path),
          );
          const staged = state.files.filter((entry) =>
            state.staged.includes(entry.path),
          );
          return {
            repo: state.repo,
            branch: state.branch,
            ahead: state.staged.length,
            behind: 0,
            staged: staged.map((entry) => entry.path),
            untracked: untrackedFiles.map((entry) => entry.path),
            changes: changes.map((entry) => ({
              path: entry.path,
              status: state.untracked.includes(entry.path)
                ? "untracked"
                : state.staged.includes(entry.path)
                  ? "staged"
                  : "modified",
            })),
            clean: changes.length === 0 && untrackedFiles.length === 0,
          };
        }),
      )
      .handle("storedFile", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          if (rawPath === undefined) {
            return yield* Effect.die(
              new Error("GitMock: storedFile requires a path"),
            );
          }
          const path = decodePath(rawPath);
          const file = yield* findFile(state, path);
          const snapshot = state.snapshots.find((entry) => entry.path === path);
          return {
            ...file,
            turnId: snapshot?.turnId ?? state.turns[0]?.id ?? newId("turn"),
            storedAt: snapshot?.storedAt ?? file.updatedAt,
          };
        }),
      )
      .handle("storedTree", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          const path = rawPath === undefined ? undefined : decodePath(rawPath);
          const files = path
            ? state.snapshots.filter((entry) =>
                entry.path.startsWith(`${path}/`),
              )
            : state.snapshots;
          return {
            repo: state.repo,
            branch: state.branch,
            path: path ?? null,
            turnId: state.turns[0]?.id ?? newId("turn"),
            entries: treeEntries(files),
          };
        }),
      )
      .handle("tree", ({ params, query }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const rawPath = pathFrom(query);
          const path = rawPath === undefined ? undefined : decodePath(rawPath);
          const files = path
            ? state.files.filter((entry) => entry.path.startsWith(`${path}/`))
            : state.files;
          return {
            repo: state.repo,
            branch: state.branch,
            path: path ?? null,
            entries: treeEntries(files),
          };
        }),
      )
      .handle("turns", ({ params }) =>
        Effect.gen(function* () {
          const state = yield* stateFor(params);
          const pull = (yield* Ref.get(pulls)).find(
            (entry) => entry.threadId === params.jamId,
          );
          return state.turns.map((turn) => ({
            ...turn,
            repo: state.repo,
            branch: state.branch,
            pullNumber: pull?.number ?? null,
            pullId: pull?.id ?? null,
            files: turn.files.map((path) => ({
              path,
              language:
                state.files.find((entry) => entry.path === path)?.language ??
                "text",
            })),
          }));
        }),
      );
  }),
);
