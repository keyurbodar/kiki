import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId, type Row } from "../db/MockDb.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  issueActivity,
  issueComments,
  issueLinks,
  issueRelations,
  threadIssueIds,
} from "./fixtures.ts";

type IssueRow = Row<"issues">;

const asText = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const asString = (value: unknown) => String(value ?? "");

function findIssue(code: string) {
  return Effect.gen(function* () {
    const { issues } = yield* MockDb;
    const issue = (yield* Ref.get(issues)).find(
      (row) => row.code === code || row.id === code,
    );
    if (!issue) return yield* missing("issues", code);
    return issue;
  });
}

const summary = (issue: IssueRow) => ({
  id: issue.id,
  code: issue.code,
  title: issue.title,
  stateId: issue.stateId,
  assigneeId: issue.assigneeId,
  priority: issue.priority,
  updatedAt: issue.updatedAt,
});

export const IssuesMock = mockGroup("issues", (handlers) =>
  Effect.gen(function* () {
    const { issues, issueStates, issueLabels, pulls, captains } = yield* MockDb;
    const prefix = yield* Ref.make("ACME");
    const comments = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([
      ...issueComments,
    ]);
    const links = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([
      ...issueLinks,
    ]);
    const relations = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([
      ...issueRelations,
    ]);
    const seen = yield* Ref.make<ReadonlyArray<string>>([]);
    const unread = yield* Ref.make<ReadonlyArray<string>>([]);
    const subscriptions = yield* Ref.make<Readonly<Record<string, boolean>>>(
      {},
    );

    return handlers
      .handle("captainActivity", ({ params }) =>
        Effect.gen(function* () {
          const captain = (yield* Ref.get(captains)).find(
            (row) => row.id === params.jamId,
          );
          if (!captain) return yield* missing("captains", params.jamId);
          const threadIds = new Set(captain.crew);
          const rows = yield* Ref.get(issues);
          const allPulls = yield* Ref.get(pulls);
          const items = rows
            .filter(
              (issue) =>
                issue.threadIds.some((id) => threadIds.has(id)) ||
                issue.pullIds.some((id) =>
                  allPulls.some(
                    (pull) =>
                      pull.id === id && threadIds.has(pull.threadId ?? ""),
                  ),
                ),
            )
            .map(summary);
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
          const value = asText(fields(payload).prefix, "ACME");
          yield* Ref.set(prefix, value);
          return { prefix: value };
        }),
      )
      .handle("states", () => Ref.get(issueStates))
      .handle("createState", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(issueStates);
          const state = {
            id: newId("ist"),
            name: asText(input.name, "New state"),
            category: asText(input.category, "started"),
            color: asText(input.color, "default"),
            position: rows.length,
            isDefault: false,
          };
          yield* Ref.set(issueStates, [...rows, state]);
          return state;
        }),
      )
      .handle("updateState", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issueStates);
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
            issueStates,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("stateCounts", () =>
        Effect.gen(function* () {
          const counts: Record<string, number> = {};
          for (const issue of yield* Ref.get(issues)) {
            counts[issue.stateId] = (counts[issue.stateId] ?? 0) + 1;
          }
          return counts;
        }),
      )
      .handle("reorderStates", ({ payload }) => {
        const input = fields(payload);
        const order = Array.isArray(input.stateIds)
          ? input.stateIds.map(asString)
          : [];
        return Effect.gen(function* () {
          const rows = yield* Ref.get(issueStates);
          const ordered = [
            ...order
              .map((id) => rows.find((row) => row.id === id))
              .filter(
                (row): row is NonNullable<typeof row> => row !== undefined,
              )
              .map((row, position) => ({ ...row, position })),
            ...rows
              .filter((row) => !order.includes(row.id))
              .map((row, index) => ({
                ...row,
                position: order.length + index,
              })),
          ];
          yield* Ref.set(issueStates, ordered);
          return ordered;
        });
      })
      .handle("summariesByCode", ({ query }) =>
        Effect.gen(function* () {
          const search = asString(query.search).toLowerCase();
          const rows = yield* Ref.get(issues);
          return rows
            .filter(
              (issue) =>
                search.length === 0 ||
                issue.code.toLowerCase().includes(search) ||
                issue.title.toLowerCase().includes(search),
            )
            .map((issue) => ({
              ...summary(issue),
              description: issue.title,
              projectId: issue.projectId,
            }));
        }),
      )
      .handle("summary", ({ params }) =>
        findIssue(params.issueId).pipe(
          Effect.map((issue) => ({
            ...summary(issue),
            description: issue.title,
            projectId: issue.projectId,
          })),
        ),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issues);
          const states = yield* Ref.get(issueStates);
          const labels = yield* Ref.get(issueLabels);
          const stateId =
            query.stateId === undefined ? undefined : asString(query.stateId);
          const assigneeId =
            query.assigneeId === undefined
              ? undefined
              : asString(query.assigneeId);
          const search = asString(query.search).toLowerCase();
          const matching = rows
            .filter(
              (issue) => stateId === undefined || issue.stateId === stateId,
            )
            .filter(
              (issue) =>
                assigneeId === undefined || issue.assigneeId === assigneeId,
            )
            .filter(
              (issue) =>
                search.length === 0 ||
                issue.title.toLowerCase().includes(search) ||
                issue.code.toLowerCase().includes(search),
            );
          const decorated = matching.map((issue) => ({
            ...issue,
            state: states.find((state) => state.id === issue.stateId),
            labels: labels.filter((label) => issue.labelIds.includes(label.id)),
          }));
          if (query.cursor !== undefined) {
            return { items: decorated, cursor: null };
          }
          return decorated;
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(issues);
          const currentPrefix = yield* Ref.get(prefix);
          const number = Math.max(0, ...rows.map((issue) => issue.number)) + 1;
          const issue = {
            id: newId("iss"),
            number,
            code: `${currentPrefix}-${number}`,
            title: asText(input.title, "New issue"),
            stateId: asText(input.stateId, "ist_sample_todo"),
            projectId: asText(input.projectId, "proj_sample_web"),
            assigneeId:
              typeof input.assigneeId === "string" ? input.assigneeId : null,
            creatorId: people.alex.id,
            labelIds: Array.isArray(input.labelIds)
              ? input.labelIds.map(asString)
              : [],
            threadIds: [],
            pullIds: [],
            parentCode:
              typeof input.parentCode === "string" ? input.parentCode : null,
            priority: asText(input.priority, "normal"),
            createdAt: isoMinutesAgo(0),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(issues, [...rows, issue]);
          return issue;
        }),
      )
      .handle("get", ({ params }) => findIssue(params.code))
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const input = fields(payload);
          const updated = {
            ...issue,
            ...(typeof input.title === "string" ? { title: input.title } : {}),
            ...(typeof input.stateId === "string"
              ? { stateId: input.stateId }
              : {}),
            ...(typeof input.projectId === "string"
              ? { projectId: input.projectId }
              : {}),
            ...(typeof input.priority === "string"
              ? { priority: input.priority }
              : {}),
            ...(typeof input.assigneeId === "string"
              ? { assigneeId: input.assigneeId }
              : {}),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(issues, (rows) =>
            rows.map((row) => (row.id === issue.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("comment", ({ params, payload }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const comment = {
            id: newId("cmt"),
            issueCode: issue.code,
            authorId: people.alex.id,
            body: asText(fields(payload).body, "Comment"),
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(comments, (rows) => [...rows, comment]);
          return comment;
        }),
      )
      .handle("fileUrl", ({ params }) =>
        Effect.succeed({
          url: `https://files.example.com/acme/issues/${asString(params.code)}/files/${asString(params.fileId)}`,
          fileName: "checkout-log.txt",
          expiresAt: isoMinutesAgo(-60),
        }),
      )
      .handle("link", ({ params, payload }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const input = fields(payload);
          const link = {
            id: newId("lnk"),
            issueCode: issue.code,
            url: asText(input.url, "https://example.com"),
            title: asText(input.title, "Link"),
            kind: asText(input.kind, "other"),
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(links, (rows) => [...rows, link]);
          return link;
        }),
      )
      .handle("unlink", ({ params, query }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const linkId = asString(query.linkId);
          yield* Ref.set(
            links,
            (yield* Ref.get(links)).filter((row) => row.id !== linkId),
          );
          return { ok: true, issueCode: issue.code, linkId };
        }),
      )
      .handle("relate", ({ params, payload }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const input = fields(payload);
          const relation = {
            id: newId("rel"),
            issueCode: issue.code,
            relatedCode: asText(input.relatedCode, "ACME-1"),
            kind: asText(input.kind, "related"),
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(relations, (rows) => [...rows, relation]);
          return relation;
        }),
      )
      .handle("relations", ({ params }) =>
        findIssue(params.code).pipe(
          Effect.flatMap((issue) =>
            Ref.get(relations).pipe(
              Effect.map((rows) =>
                rows.filter((row) => row.issueCode === issue.code),
              ),
            ),
          ),
        ),
      )
      .handle("unrelate", ({ params, query }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const relationId = asString(query.relationId);
          yield* Ref.set(
            relations,
            (yield* Ref.get(relations)).filter((row) => row.id !== relationId),
          );
          return { ok: true, issueCode: issue.code, relationId };
        }),
      )
      .handle("markSeen", ({ params }) =>
        findIssue(params.code).pipe(
          Effect.flatMap((issue) =>
            Ref.update(seen, (rows) =>
              rows.includes(issue.code) ? rows : [...rows, issue.code],
            ).pipe(Effect.as({ ok: true, issueCode: issue.code })),
          ),
        ),
      )
      .handle("setSubscription", ({ params, payload }) =>
        Effect.gen(function* () {
          const issue = yield* findIssue(params.code);
          const subscribed = fields(payload).subscribed !== false;
          yield* Ref.update(subscriptions, (rows) => ({
            ...rows,
            [issue.code]: subscribed,
          }));
          return { issueCode: issue.code, subscribed };
        }),
      )
      .handle("markUnread", ({ params }) =>
        findIssue(params.code).pipe(
          Effect.flatMap((issue) =>
            Ref.update(unread, (rows) =>
              rows.includes(issue.code) ? rows : [...rows, issue.code],
            ).pipe(Effect.as({ ok: true, issueCode: issue.code })),
          ),
        ),
      )
      .handle("assignedCount", () =>
        Ref.get(issues).pipe(
          Effect.map((rows) => rows.filter((row) => row.assigneeId).length),
        ),
      )
      .handle("mentionCount", ({ query }) =>
        Effect.gen(function* () {
          const userId = asString(query.userId || people.alex.id);
          const subscribed = yield* Ref.get(subscriptions);
          const rows = yield* Ref.get(issues);
          return rows.filter(
            (issue) =>
              issue.assigneeId === userId || subscribed[issue.code] === true,
          ).length;
        }),
      )
      .handle("byPull", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issues);
          const matching = rows.filter((issue) =>
            issue.pullIds.includes(params.pullId),
          );
          if (matching.length > 0) return matching;
          const pull = (yield* Ref.get(pulls)).find(
            (row) => row.id === params.pullId,
          );
          if (!pull) return yield* missing("pulls", params.pullId);
          return rows.filter((issue) =>
            issue.threadIds.includes(pull.threadId ?? ""),
          );
        }),
      );
  }),
);
