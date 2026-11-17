import { DateTime, Effect, Ref } from "effect";
import type { IssueRelationKind } from "../../api/schemas/issue.ts";
import { IssueList, IssueRelationPage } from "../../api/schemas/issue.ts";
import { fields, MockDb, missing, newId, type Row } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { isoMinutesAgo, org, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { issueActivity, threadIssueIds } from "./fixtures.ts";
import {
  extraOf,
  type IssueExtra,
  type IssueWorld,
  issueExtras,
  statusOfState,
  toIssueDetail,
  toIssueStateList,
  toIssueSummary,
} from "./issue-detail.ts";

type IssueRow = Row<"issues">;

const pullMatches = (ref: string, pull: Row<"pulls">) => {
  const trimmed = ref.trim().replace(/^https:\/\/github\.com\//u, "");
  return (
    trimmed === `${pull.repo}#${pull.number}` ||
    trimmed === `${pull.repo}/pull/${pull.number}` ||
    trimmed === `#${pull.number}` ||
    trimmed === String(pull.number)
  );
};

export const IssuesMock = mockGroup("issues", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const extras = yield* Ref.make<Record<string, IssueExtra>>(issueExtras);
    const prefix = yield* Ref.make<string>(org.issuePrefix);

    const snapshot = Effect.gen(function* () {
      const world: IssueWorld = {
        issues: yield* Ref.get(db.issues),
        states: yield* Ref.get(db.issueStates),
        labels: yield* Ref.get(db.issueLabels),
        pulls: yield* Ref.get(db.pulls),
        extras: yield* Ref.get(extras),
      };
      return world;
    });

    const find = (code: string) =>
      Effect.gen(function* () {
        const world = yield* snapshot;
        const row = world.issues.find((issue) => issue.code === code);
        if (!row) return yield* missing("issues", code);
        return { world, row };
      });

    const detail = (code: string) =>
      find(code).pipe(
        Effect.map(({ world, row }) => toIssueDetail(world, row)),
      );

    const patchRow = (code: string, patch: Partial<IssueRow>) =>
      Ref.update(db.issues, (rows) =>
        rows.map((row) =>
          row.code === code
            ? {
                ...row,
                ...patch,
                updatedAt: DateTime.formatIso(fixtureNow),
              }
            : row,
        ),
      );

    const patchExtra = (code: string, patch: Partial<IssueExtra>) =>
      Ref.update(extras, (all) => ({
        ...all,
        [code]: { ...extraOf(all, code), ...patch },
      }));

    const setRelations = (
      code: string,
      update: (relations: IssueExtra["relations"]) => IssueExtra["relations"],
    ) =>
      Ref.update(extras, (all) => {
        const current = extraOf(all, code);
        return {
          ...all,
          [code]: { ...current, relations: update(current.relations) },
        };
      });

    return handlers
      .handle("states", () =>
        Ref.get(db.issueStates).pipe(Effect.map(toIssueStateList)),
      )
      .handle("list", () =>
        snapshot.pipe(
          Effect.map(
            (world) =>
              new IssueList({
                issues: world.issues.map((row) => toIssueSummary(world, row)),
                cursor: null,
                prefix: org.issuePrefix,
              }),
          ),
        ),
      )
      .handle("summariesByCode", ({ query }) =>
        snapshot.pipe(
          Effect.map((world) => {
            const codes = [query.codes ?? []].flat();
            return world.issues
              .filter((row) => codes.includes(row.code))
              .map((row) => toIssueSummary(world, row));
          }),
        ),
      )
      .handle("get", ({ params }) => detail(params.code))
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(db.issues);
          const states = yield* Ref.get(db.issueStates);
          const number = Math.max(0, ...rows.map((row) => row.number)) + 1;
          const code = `${org.issuePrefix}-${number}`;
          const now = DateTime.formatIso(fixtureNow);
          const stateId =
            payload.stateId ??
            states.find((state) => state.isDefault)?.id ??
            states[0]?.id ??
            "";
          const row: IssueRow = {
            id: `iss_mock_${number}`,
            number,
            code,
            title: payload.title,
            stateId,
            projectId: payload.projectId,
            assigneeId:
              payload.assignee?.kind === "user" ? payload.assignee.id : null,
            creatorId: viewer.id,
            labelIds: [...(payload.labelIds ?? [])],
            threadIds: [],
            pullIds: [],
            parentCode: payload.parentCode ?? null,
            priority: payload.priority ?? "normal",
            createdAt: now,
            updatedAt: now,
          };
          yield* Ref.update(db.issues, (all) => [...all, row]);
          yield* patchExtra(code, {
            description: payload.description ?? "",
            ...(payload.dueAt ? { dueAt: payload.dueAt } : {}),
            subscribed: true,
          });
          return yield* detail(code);
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const { world } = yield* find(params.code);
          const stateFromStatus =
            payload.status === undefined
              ? undefined
              : world.states.find(
                  (state) => statusOfState(state) === payload.status,
                )?.id;
          yield* patchRow(params.code, {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.stateId !== undefined
              ? { stateId: payload.stateId }
              : stateFromStatus !== undefined
                ? { stateId: stateFromStatus }
                : {}),
            ...(payload.priority !== undefined
              ? { priority: payload.priority }
              : {}),
            ...(payload.assignee !== undefined
              ? {
                  assigneeId:
                    payload.assignee?.kind === "user"
                      ? payload.assignee.id
                      : null,
                }
              : {}),
            ...(payload.labelIds !== undefined
              ? { labelIds: [...payload.labelIds] }
              : {}),
            ...(payload.parentCode !== undefined
              ? { parentCode: payload.parentCode }
              : {}),
          });
          if (payload.description !== undefined) {
            yield* patchExtra(params.code, {
              description: payload.description,
            });
          }
          if (payload.dueAt !== undefined) {
            const current = extraOf(yield* Ref.get(extras), params.code);
            const { dueAt: _dropped, ...rest } = current;
            yield* Ref.update(extras, (all) => ({
              ...all,
              [params.code]:
                payload.dueAt === null
                  ? rest
                  : { ...rest, dueAt: payload.dueAt ?? undefined },
            }));
          }
          return yield* detail(params.code);
        }),
      )
      .handle("link", ({ params, payload }) =>
        Effect.gen(function* () {
          const { row } = yield* find(params.code);
          const pulls = yield* Ref.get(db.pulls);
          const pull = pulls.find((candidate) =>
            pullMatches(payload.ref, candidate),
          );
          if (!pull) return yield* missing("pulls", payload.ref);
          if (!row.pullIds.includes(pull.id)) {
            yield* patchRow(params.code, {
              pullIds: [...row.pullIds, pull.id],
            });
          }
          return yield* detail(params.code);
        }),
      )
      .handle("unlink", ({ params, payload }) =>
        Effect.gen(function* () {
          const { row } = yield* find(params.code);
          const target = payload.target;
          yield* patchRow(
            params.code,
            target.kind === "pull"
              ? { pullIds: row.pullIds.filter((id) => id !== target.pullId) }
              : {
                  threadIds: row.threadIds.filter((id) => id !== target.jamId),
                },
          );
          return yield* detail(params.code);
        }),
      )
      .handle("relate", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* find(params.code);
          yield* find(payload.issue);
          yield* setRelations(params.code, (relations) => [
            ...relations.filter((relation) => relation.code !== payload.issue),
            {
              relation: payload.relation as IssueRelationKind,
              code: payload.issue,
            },
          ]);
          return yield* detail(params.code);
        }),
      )
      .handle("unrelate", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* find(params.code);
          yield* setRelations(params.code, (relations) =>
            relations.filter((relation) => relation.code !== payload.issue),
          );
          yield* setRelations(payload.issue, (relations) =>
            relations.filter((relation) => relation.code !== params.code),
          );
          return yield* detail(params.code);
        }),
      )
      .handle("relations", ({ params, query }) =>
        detail(params.code).pipe(
          Effect.map((issue) => {
            const all = issue.relations ?? [];
            const offset = query.offset ?? 0;
            return new IssueRelationPage({
              relations: all.slice(offset, offset + query.limit),
              total: all.length,
            });
          }),
        ),
      )
      .handle("setSubscription", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* find(params.code);
          yield* patchExtra(params.code, { subscribed: payload.subscribed });
          return (yield* detail(params.code)).issue.viewer;
        }),
      )
      .handle("markUnread", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.code);
          yield* patchExtra(params.code, { unread: true });
          return (yield* detail(params.code)).issue.viewer;
        }),
      )
      .handle("markSeen", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.code);
          yield* patchExtra(params.code, { unread: false });
          return (yield* detail(params.code)).issue.viewer;
        }),
      )
      .handle("summary", ({ params }) =>
        Effect.gen(function* () {
          const world = yield* snapshot;
          const row = world.issues.find((issue) => issue.id === params.issueId);
          if (!row) return yield* missing("issues", params.issueId);
          return toIssueSummary(world, row);
        }),
      )
      .handle("byPull", ({ params }) =>
        snapshot.pipe(
          Effect.map((world) =>
            world.issues
              .filter((row) => row.pullIds.includes(params.pullId))
              .map((row) => toIssueSummary(world, row)),
          ),
        ),
      )
      .handle("comment", ({ params, payload }) =>
        Effect.gen(function* () {
          const { row } = yield* find(params.code);
          const current = extraOf(yield* Ref.get(extras), params.code);
          yield* patchExtra(params.code, {
            comments: [
              ...current.comments,
              { authorId: viewer.id, body: payload.body, minutesAgo: 0 },
            ],
          });
          const detailNow = yield* detail(row.code);
          const posted = detailNow.comments.at(-1);
          if (!posted) return yield* missing("issues", params.code);
          return posted;
        }),
      )
      .handle("captainActivity", ({ params }) =>
        Effect.gen(function* () {
          const captain = (yield* Ref.get(db.captains)).find(
            (row) => row.id === params.jamId,
          );
          if (!captain) return yield* missing("captains", params.jamId);
          const threadIds = new Set(captain.crew);
          const rows = yield* Ref.get(db.issues);
          const items = rows
            .filter((issue) => issue.threadIds.some((id) => threadIds.has(id)))
            .map((issue) => ({
              id: issue.id,
              code: issue.code,
              title: issue.title,
              stateId: issue.stateId,
            }));
          const activity = issueActivity.filter((entry) => {
            const threadId = Object.entries(threadIssueIds).find(
              ([, code]) => code === entry.issueCode,
            )?.[0];
            return threadId !== undefined && threadIds.has(threadId);
          });
          return { captainId: captain.id, items, activity };
        }),
      )
      .handle("prefix", () =>
        Ref.get(prefix).pipe(Effect.map((value) => ({ prefix: value }))),
      )
      .handle("setPrefix", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload).prefix;
          const value = typeof input === "string" ? input : org.issuePrefix;
          yield* Ref.set(prefix, value);
          return { prefix: value };
        }),
      )
      .handle("createState", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(db.issueStates);
          const state = {
            id: newId("ist"),
            name: typeof input.name === "string" ? input.name : "New state",
            category:
              typeof input.category === "string" ? input.category : "started",
            color: typeof input.color === "string" ? input.color : "default",
            position: rows.length,
            isDefault: false,
          };
          yield* Ref.set(db.issueStates, [...rows, state]);
          return state;
        }),
      )
      .handle("updateState", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(db.issueStates);
          const current = rows.find((row) => row.id === params.stateId);
          if (!current) return yield* missing("issueStates", params.stateId);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.color === "string" ? { color: input.color } : {}),
            ...(typeof input.category === "string"
              ? { category: input.category }
              : {}),
          };
          yield* Ref.set(
            db.issueStates,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("stateCounts", () =>
        Effect.gen(function* () {
          const counts: Record<string, number> = {};
          for (const issue of yield* Ref.get(db.issues)) {
            counts[issue.stateId] = (counts[issue.stateId] ?? 0) + 1;
          }
          return counts;
        }),
      )
      .handle("reorderStates", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const order = Array.isArray(input.stateIds)
            ? input.stateIds.map((id) => String(id))
            : [];
          const rows = yield* Ref.get(db.issueStates);
          const ordered = [
            ...order.flatMap((id) => rows.filter((row) => row.id === id)),
            ...rows.filter((row) => !order.includes(row.id)),
          ].map((row, position) => ({ ...row, position }));
          yield* Ref.set(db.issueStates, ordered);
          return ordered;
        }),
      )
      .handle("fileUrl", ({ params }) =>
        Effect.succeed({
          url: `https://files.example.com/acme/issues/${params.code}/files/${params.fileId}`,
          fileName: "checkout-log.txt",
          expiresAt: isoMinutesAgo(-60),
        }),
      )
      .handle("assignedCount", () =>
        Ref.get(db.issues).pipe(
          Effect.map((rows) => rows.filter((row) => row.assigneeId).length),
        ),
      )
      .handle("mentionCount", () =>
        snapshot.pipe(
          Effect.map(
            (world) =>
              world.issues.filter(
                (issue) =>
                  issue.assigneeId === viewer.id ||
                  extraOf(world.extras, issue.code).subscribed,
              ).length,
          ),
        ),
      );
  }),
);
