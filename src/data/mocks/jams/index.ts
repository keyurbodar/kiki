import { DateTime, Effect, Ref } from "effect";
import { JamNotFound } from "../../api/schemas/errors.ts";
import {
  JamId,
  ProjectId,
  ThreadFolderId,
  ThreadTagId,
  UserId,
} from "../../api/schemas/ids.ts";
import {
  FolderCount,
  JamArchiveResult,
  JamBatchResult,
  JamDetail,
  JamSlackLink,
  ThreadCard,
  ThreadCardPage,
  ThreadCounts,
  ThreadMember,
  ThreadMembership,
} from "../../api/schemas/thread.ts";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, world } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  accessTemplate,
  projectOf,
  sampleAccessRequests,
  sampleAd,
  sampleAdHocAsks,
  sampleConnectionUsage,
  sampleCredits,
  sampleFeedbackRequests,
  sampleThreadAccess,
  sampleThreads,
  sampleUsage,
  type ThreadAccess,
  threadIssuesOf,
} from "./fixtures.ts";

const defaultPageSize = 50;

const cursorOf = (thread: ThreadCard) =>
  `${DateTime.toEpochMillis(thread.sortActivityAt)}:${thread.id}`;

const value = (
  input: Record<string, unknown>,
  key: string,
  fallback: unknown,
) => input[key] ?? fallback;

const stringValue = (
  input: Record<string, unknown>,
  key: string,
  fallback: string,
) => {
  const candidate = input[key];
  return typeof candidate === "string" ? candidate : fallback;
};

const booleanValue = (
  input: Record<string, unknown>,
  key: string,
  fallback: boolean,
) => {
  const candidate = input[key];
  return typeof candidate === "boolean" ? candidate : fallback;
};

const listValue = (input: Record<string, unknown>, key: string) =>
  Array.isArray(input[key]) ? (input[key] as ReadonlyArray<string>) : undefined;

const person = (id: string) => world.members.find((member) => member.id === id);

const memberSummary = (id: string) => {
  const found = person(id);
  return {
    id,
    name: found ? `${found.firstName} ${found.lastName}` : id,
    email: found?.email ?? `${id}@example.com`,
    role: found?.role ?? "member",
  };
};

const issueSummary = (issue: (typeof world.issues)[number]) => ({
  id: issue.id,
  code: issue.code,
  number: issue.number,
  title: issue.title,
  stateId: issue.stateId,
  priority: issue.priority,
  projectId: issue.projectId,
  assigneeId: issue.assigneeId,
  labelIds: issue.labelIds,
  updatedAt: issue.updatedAt,
});

const fallbackThread: ThreadCard =
  sampleThreads[0] ??
  new ThreadCard({
    id: JamId.make(world.threads.checkoutTest.id),
    primaryMachine: undefined,
    title: world.threads.checkoutTest.title,
    titleCustom: false,
    status: "working",
    archived: false,
    archivedIdleDays: null,
    threadNumber: world.threads.checkoutTest.number,
    userId: UserId.make(world.people.alex.id),
    userType: "human",
    takenFromUserId: null,
    takenFromUserType: null,
    origin: "web",
    projectId: ProjectId.make(world.projects.web.id),
    slackChannel: null,
    linearIssue: null,
    pinned: false,
    settledAt: undefined,
    section: undefined,
    member: true,
    subscribed: true,
    personal: false,
    tagIds: [],
    importing: false,
    lastModelId: null,
    pulls: [],
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(0),
    lastActivityAt: minutesAgo(0),
    preview: null,
    sortActivityAt: minutesAgo(0),
    hasUnreads: false,
    mentionCount: 0,
    owed: false,
    needsYou: false,
    ask: null,
    crewNeedsYou: 0,
    participated: true,
    crewMentionCount: 0,
    needsYouEventId: null,
    captain: undefined,
    crewCount: undefined,
    automation: undefined,
  });

const activity = () => minutesAgo(0);

export const JamsMock = mockGroup("jams", (handlers) =>
  Effect.gen(function* () {
    const { jams, threadPins, threadTagAssignments, threadFolderItems } =
      yield* MockDb;
    const threads = yield* Ref.make<ReadonlyArray<ThreadCard>>(sampleThreads);

    const organize = (card: ThreadCard) =>
      Effect.gen(function* () {
        const pins = yield* Ref.get(threadPins);
        const tags = yield* Ref.get(threadTagAssignments);
        return new ThreadCard({
          ...card,
          pinned: pins.some((pin) => pin.jamId === card.id),
          tagIds: tags
            .filter((tag) => tag.jamId === card.id)
            .map((tag) => ThreadTagId.make(tag.tagId)),
        });
      });

    const organizedThreads = Effect.gen(function* () {
      return yield* Effect.forEach(yield* Ref.get(threads), organize);
    });

    const batchOutcomes = (
      jamIds: ReadonlyArray<JamId>,
      change: (row: ThreadCard) => ThreadCard | null,
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(threads);
        const known = new Set<string>(rows.map((row) => row.id));
        yield* Ref.set(
          threads,
          rows.flatMap((row) => {
            if (!jamIds.includes(row.id)) return [row];
            const next = change(row);
            return next === null ? [] : [next];
          }),
        );
        return jamIds.map((jamId) => ({
          jamId,
          outcome: known.has(jamId) ? ("ok" as const) : ("not_found" as const),
        }));
      });

    const setArchived = (jamIds: ReadonlyArray<JamId>, archived: boolean) => {
      const changedAt = activity();
      return batchOutcomes(
        jamIds,
        (row) =>
          new ThreadCard({
            ...row,
            archived,
            status: archived ? "archived" : "idle",
            updatedAt: changedAt,
            sortActivityAt: changedAt,
          }),
      );
    };
    const access =
      yield* Ref.make<ReadonlyArray<ThreadAccess>>(sampleThreadAccess);
    const accessRequests =
      yield* Ref.make<ReadonlyArray<(typeof sampleAccessRequests)[number]>>(
        sampleAccessRequests,
      );
    const credits =
      yield* Ref.make<ReadonlyArray<(typeof sampleCredits)[number]>>(
        sampleCredits,
      );
    const environment = yield* Ref.make<
      Readonly<Record<string, Record<string, string>>>
    >(
      Object.fromEntries(
        sampleThreadAccess.map((entry) => [
          entry.jamId,
          { ...entry.environment },
        ]),
      ),
    );
    const ad = yield* Ref.make(sampleAd);
    const feedbackRequests = yield* Ref.make(sampleFeedbackRequests);
    const adHocAsks =
      yield* Ref.make<ReadonlyArray<(typeof sampleAdHocAsks)[number]>>(
        sampleAdHocAsks,
      );
    const usage = yield* Ref.make(sampleUsage);
    const connectionUsage = yield* Ref.make(sampleConnectionUsage);
    const terminalRequests = yield* Ref.make<
      ReadonlyArray<{
        readonly jamId: string;
        readonly toolCallId: string;
        readonly state: string;
        readonly title: string;
      }>
    >([
      {
        jamId: world.threads.checkoutTest.id,
        toolCallId: "tool_sample_terminal_1",
        state: "pending",
        title: "Approve running the checkout test again?",
      },
    ]);
    const desktopRequests = yield* Ref.make<
      ReadonlyArray<{
        readonly jamId: string;
        readonly toolCallId: string;
        readonly state: string;
        readonly title: string;
      }>
    >([
      {
        jamId: world.threads.darkMode.id,
        toolCallId: "tool_sample_desktop_1",
        state: "pending",
        title: "Open the settings page in the browser?",
      },
    ]);

    const currentAccess = (jamId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(access);
        const found = rows.find((row) => row.jamId === jamId);
        if (!found)
          return yield* Effect.die(new Error(`jams: no access for ${jamId}`));
        return found;
      });

    const patchAccess = (
      jamId: string,
      change: (current: ThreadAccess) => ThreadAccess,
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(access);
        const current = rows.find((row) => row.jamId === jamId);
        if (!current) {
          return yield* Effect.die(new Error(`jams: no access for ${jamId}`));
        }
        const updated = rows.map((row) =>
          row.jamId === jamId ? change(row) : row,
        );
        yield* Ref.set(access, updated);
        return change(current);
      });

    const threadSummary = (jamId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(threads);
        const found = rows.find((row) => row.id === jamId);
        if (!found)
          return yield* Effect.die(new Error(`jams: no thread ${jamId}`));
        return {
          id: found.id,
          number: found.threadNumber,
          title: found.title,
          status: found.status,
          projectId: found.projectId,
          archived: found.archived,
          preview: found.preview,
          updatedAt: DateTime.formatIso(found.updatedAt),
        };
      });

    const renameThread = (jamId: string, title: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(threads);
        if (!rows.some((row) => row.id === jamId)) {
          return yield* Effect.die(new Error(`jams: no thread ${jamId}`));
        }
        const updated = rows.map((row) =>
          row.id === jamId
            ? new ThreadCard({
                ...row,
                title,
                titleCustom: true,
                updatedAt: activity(),
                sortActivityAt: activity(),
              })
            : row,
        );
        yield* Ref.set(threads, updated);
        return updated.find((row) => row.id === jamId) ?? fallbackThread;
      });

    return handlers
      .handle("organization", ({ params }) =>
        Effect.gen(function* () {
          const thread = yield* threadSummary(params.jamId);
          const projectId = projectOf(params.jamId);
          const project = Object.values(world.projects).find(
            (candidate) => candidate.id === projectId,
          );
          return {
            id: world.org.id,
            name: world.org.name,
            slug: world.org.slug,
            domain: world.org.domain,
            issuePrefix: world.org.issuePrefix,
            createdAt: world.org.createdAt,
            thread,
            project: project
              ? {
                  id: project.id,
                  code: project.code,
                  name: project.name,
                  repos: project.repos,
                }
              : null,
            members: world.members.map((member) => memberSummary(member.id)),
          };
        }),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const search = query.search?.toLowerCase();
          const sortKey =
            query.sort === "createdAt" ? "createdAt" : "sortActivityAt";
          const folderItems = yield* Ref.get(threadFolderItems);
          const inFolder = (jamId: string, folderId?: string) =>
            folderItems.some(
              (item) =>
                item.jamId === jamId &&
                (folderId === undefined || item.folderId === folderId),
            );
          const matching = (yield* organizedThreads)
            .filter((thread) =>
              query.archived === "only" ? thread.archived : !thread.archived,
            )
            .filter(
              (thread) =>
                query.tagIds === undefined ||
                query.tagIds.some((tagId) => thread.tagIds.includes(tagId)),
            )
            .filter(
              (thread) =>
                query.folderId === undefined ||
                inFolder(thread.id, query.folderId),
            )
            .filter(
              (thread) => query.filed !== "exclude" || !inFolder(thread.id),
            )
            .filter(
              (thread) =>
                query.projectIds === undefined ||
                (thread.projectId !== null &&
                  query.projectIds.includes(thread.projectId)),
            )
            .filter(
              (thread) =>
                search === undefined ||
                (thread.title ?? "").toLowerCase().includes(search),
            )
            .toSorted(
              (a, b) =>
                DateTime.toEpochMillis(b[sortKey]) -
                DateTime.toEpochMillis(a[sortKey]),
            );
          const start =
            query.cursor === undefined
              ? 0
              : matching.findIndex(
                  (thread) => cursorOf(thread) === query.cursor,
                ) + 1;
          const limit = query.limit ?? defaultPageSize;
          const items = matching.slice(start, start + limit);
          const last = items.at(-1);
          const hasMore = start + limit < matching.length;
          return new ThreadCardPage({
            items,
            cursor: hasMore && last ? cursorOf(last) : null,
          });
        }),
      )
      .handle("createProjectless", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const title = stringValue(input, "title", "New thread");
          const created = new ThreadCard({
            ...fallbackThread,
            id: JamId.make(newId("jam")),
            title,
            titleCustom: true,
            threadNumber: 42,
            projectId: null,
            status: "working",
            archived: false,
            pulls: [],
            preview: null,
            hasUnreads: false,
            createdAt: activity(),
            updatedAt: activity(),
            lastActivityAt: activity(),
            sortActivityAt: activity(),
          });
          yield* Ref.update(threads, (rows) => [created, ...rows]);
          yield* Ref.update(access, (rows) => [
            ...rows,
            {
              ...accessTemplate(created.id),
            },
          ]);
          return threadJSON(created);
        }),
      )
      .handle("create", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const title = stringValue(input, "title", "New project thread");
          const message = stringValue(input, "message", "");
          const project = Object.values(world.projects).find(
            (candidate) => candidate.id === params.projectId,
          );
          if (!project) {
            return yield* missing("repos", params.projectId);
          }
          const created = new ThreadCard({
            ...fallbackThread,
            id: JamId.make(newId("jam")),
            title,
            titleCustom: true,
            threadNumber: 42,
            projectId: ProjectId.make(project.id),
            status: "working",
            archived: false,
            pulls: [],
            preview: message === "" ? null : message,
            hasUnreads: false,
            createdAt: activity(),
            updatedAt: activity(),
            lastActivityAt: activity(),
            sortActivityAt: activity(),
          });
          yield* Ref.update(threads, (rows) => [created, ...rows]);
          yield* Ref.update(access, (rows) => [
            ...rows,
            {
              ...accessTemplate(created.id),
            },
          ]);
          yield* Ref.update(jams, (rows) => [
            ...rows,
            {
              id: created.id,
              number: created.threadNumber ?? 0,
              title,
              projectId: project.id,
            },
          ]);
          return { ...threadJSON(created), projectId: project.id };
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* organizedThreads;
          const found = rows.find((row) => row.id === params.jamId);
          if (!found) return yield* new JamNotFound({ jamId: params.jamId });
          const current = yield* currentAccess(found.id);
          return new JamDetail({
            ...found,
            parentJamId: null,
            inheritedThroughEventId: null,
            runStatus: found.status === "archived" ? "idle" : found.status,
            wakePendingAt: null,
            todos: [],
            model: null,
            servedModel: null,
            servedModelEventId: null,
            lastReadEventId: null,
            slack: current.slack
              ? new JamSlackLink({
                  active: current.slack.active,
                  channelId: current.slack.channelId,
                  threadTs: "1700000000.000100",
                  url: `https://acme.slack.com/archives/${current.slack.channelId}`,
                })
              : null,
            membership: new ThreadMembership({
              joinPolicy: current.joinPolicy === "anyone" ? "anyone" : "invite",
              members: current.memberIds.map(
                (userId) =>
                  new ThreadMember({
                    userId: UserId.make(userId),
                    invitedBy:
                      userId === current.ownerId
                        ? null
                        : UserId.make(current.ownerId),
                    joinedAt: found.createdAt,
                    subscribed: true,
                  }),
              ),
              viewerRole:
                current.ownerId === world.people.alex.id ? "owner" : "member",
              viewerSubscribed: current.subscribed,
            }),
            creditsContinue: undefined,
            requests: [],
          });
        }),
      )
      .handle("rename", ({ params, payload }) =>
        Effect.gen(function* () {
          const updated = yield* renameThread(
            params.jamId,
            payload.title ?? "Untitled thread",
          );
          return yield* organize(updated);
        }),
      )
      .handle("regenerateTitle", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* threadSummary(params.jamId);
          const updated = yield* renameThread(
            params.jamId,
            `${current.title ?? "Thread"} (revised)`,
          );
          return { ...threadJSON(updated), source: "model" };
        }),
      )
      .handle("setThreadAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const policy = stringValue(input, "policy", "invite");
          if (!["everyone", "invite", "org"].includes(policy)) {
            return yield* Effect.die(
              new Error(`jams: unknown access policy ${policy}`),
            );
          }
          const memberIds = listValue(input, "memberIds");
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            policy: policy as ThreadAccess["policy"],
            memberIds: memberIds ?? current.memberIds,
          }));
          return {
            jamId: updated.jamId,
            policy: updated.policy,
            memberIds: updated.memberIds.map(memberSummary),
          };
        }),
      )
      .handle("requestThreadAccess", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(accessRequests);
          const request = {
            id: newId("req"),
            jamId: params.jamId,
            userId: world.people.priya.id,
            requesterId: world.people.priya.id,
            status: "pending",
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.set(accessRequests, [...rows, request]);
          return { ...request, user: memberSummary(request.userId) };
        }),
      )
      .handle("threadAccessRequests", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(accessRequests);
          return rows
            .filter((row) => row.jamId === params.jamId)
            .map((row) => ({ ...row, user: memberSummary(row.userId) }));
        }),
      )
      .handle("declineThreadAccessRequest", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(accessRequests);
          if (
            !rows.some(
              (row) =>
                row.jamId === params.jamId && row.userId === params.userId,
            )
          ) {
            return yield* Effect.die(
              new Error(
                `jams: no access request for ${params.jamId}/${params.userId}`,
              ),
            );
          }
          yield* Ref.set(
            accessRequests,
            rows.filter(
              (row) =>
                !(row.jamId === params.jamId && row.userId === params.userId),
            ),
          );
          return { ok: true };
        }),
      )
      .handle("ad", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(ad);
          return { ...current, jamId: params.jamId };
        }),
      )
      .handle("setCompactAt", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const compactAt = stringValue(input, "compactAt", isoMinutesAgo(0));
          yield* patchAccess(params.jamId, (current) => ({
            ...current,
            compactAt,
          }));
          return { jamId: params.jamId, compactAt };
        }),
      )
      .handle("retryConnection", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const provider = stringValue(input, "provider", "openai");
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            connection: {
              ...current.connection,
              provider,
              status: "connected",
              retryCount: current.connection.retryCount + 1,
            },
          }));
          return { jamId: params.jamId, ...updated.connection };
        }),
      )
      .handle("readConnectionUsage", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const provider = stringValue(input, "provider", "openai");
          const rows = yield* Ref.get(connectionUsage);
          return rows.filter((row) => row.provider === provider);
        }),
      )
      .handle("answerCredits", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const granted = {
            jamId: params.jamId,
            amount: Number(value(input, "amount", 500)),
            currency: stringValue(input, "currency", "USD"),
            state: "granted",
            reason: stringValue(input, "reason", "Approved by the owner"),
            grantedBy: world.people.alex.id,
            grantedAt: isoMinutesAgo(0),
          };
          const rows = yield* Ref.get(credits);
          yield* Ref.set(credits, [...rows, granted]);
          return granted;
        }),
      )
      .handle("revokeCredits", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(credits);
          if (!rows.some((row) => row.jamId === params.jamId)) {
            return yield* Effect.die(
              new Error(`jams: no credits for ${params.jamId}`),
            );
          }
          const revoked = rows.map((row) =>
            row.jamId === params.jamId ? { ...row, state: "revoked" } : row,
          );
          yield* Ref.set(credits, revoked);
          return { ok: true };
        }),
      )
      .handle("desktopRequestDone", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(desktopRequests);
          if (!rows.some((row) => row.toolCallId === params.toolCallId)) {
            return yield* Effect.die(
              new Error(`jams: no desktop request ${params.toolCallId}`),
            );
          }
          const done = rows.map((row) =>
            row.toolCallId === params.toolCallId
              ? { ...row, state: "done" }
              : row,
          );
          yield* Ref.set(desktopRequests, done);
          return { ok: true, toolCallId: params.toolCallId, state: "done" };
        }),
      )
      .handle("listEnvironmentVariables", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(environment);
          const variables = rows[params.jamId] ?? {};
          return Object.entries(variables).map(([name, val]) => ({
            name,
            value: val,
            masked: true,
            updatedAt: isoMinutesAgo(60),
          }));
        }),
      )
      .handle("setEnvironmentVariables", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(environment);
          const current = rows[params.jamId] ?? {};
          const next = Object.fromEntries(
            Object.entries(input).map(([name, val]) => [name, String(val)]),
          );
          yield* Ref.set(environment, {
            ...rows,
            [params.jamId]: { ...current, ...next },
          });
          return Object.entries({ ...current, ...next }).map(([name, val]) => ({
            name,
            value: val,
            masked: true,
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("deleteEnvironmentVariable", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(environment);
          const current = rows[params.jamId] ?? {};
          if (!(params.name in current)) {
            return yield* Effect.die(
              new Error(`jams: no variable ${params.name} in ${params.jamId}`),
            );
          }
          const { [params.name]: _removed, ...remaining } = current;
          yield* Ref.set(environment, { ...rows, [params.jamId]: remaining });
          return { ok: true };
        }),
      )
      .handle("refreshEnvironment", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(environment);
          const current = rows[params.jamId] ?? {};
          yield* Ref.set(environment, {
            ...rows,
            [params.jamId]: { ...current, REFRESHED_AT: isoMinutesAgo(0) },
          });
          return {
            ok: true,
            jamId: params.jamId,
            refreshedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("feedbackRequestDecline", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(feedbackRequests);
          const updated = rows.map((row) =>
            row.toolCallId === params.toolCallId
              ? { ...row, state: "declined" }
              : row,
          );
          yield* Ref.set(feedbackRequests, updated);
          return { ok: true, toolCallId: params.toolCallId, state: "declined" };
        }),
      )
      .handle("feedbackRequestSend", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(feedbackRequests);
          const updated = rows.map((row) =>
            row.toolCallId === params.toolCallId
              ? { ...row, state: "sent" }
              : row,
          );
          yield* Ref.set(feedbackRequests, updated);
          return { ok: true, toolCallId: params.toolCallId, state: "sent" };
        }),
      )
      .handle("fork", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* threadSummary(params.jamId);
          const forked = new ThreadCard({
            ...fallbackThread,
            id: JamId.make(newId("jam")),
            title: stringValue(
              input,
              "title",
              `Fork of ${current.title ?? "thread"}`,
            ),
            titleCustom: true,
            threadNumber: 43,
            projectId: current.projectId,
            origin: "web",
            pulls: [],
            hasUnreads: false,
            createdAt: activity(),
            updatedAt: activity(),
            lastActivityAt: activity(),
            sortActivityAt: activity(),
          });
          yield* Ref.update(threads, (rows) => [forked, ...rows]);
          yield* Ref.update(access, (rows) => [
            ...rows,
            {
              ...accessTemplate(forked.id),
            },
          ]);
          return { ...threadJSON(forked), forkedFrom: params.jamId };
        }),
      )
      .handle("threadIssues", ({ params }) => {
        const rows = threadIssuesOf(params.jamId);
        return Effect.succeed(
          rows.length > 0
            ? rows.map(issueSummary)
            : world.issues.slice(0, 2).map(issueSummary),
        );
      })
      .handle("setThreadIssues", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const issueIds = listValue(input, "issueIds") ?? [];
          return {
            jamId: params.jamId,
            issueIds,
            issues: world.issues
              .filter((issue) => issueIds.includes(issue.id))
              .map(issueSummary),
          };
        }),
      )
      .handle("joinThread", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            memberIds: current.memberIds.includes(world.people.casey.id)
              ? current.memberIds
              : [...current.memberIds, world.people.casey.id],
          }));
          return {
            ok: true,
            jamId: params.jamId,
            memberIds: updated.memberIds,
          };
        }),
      )
      .handle("setJoinPolicy", ({ params, payload }) =>
        Effect.gen(function* () {
          const policy = stringValue(fields(payload), "policy", "members");
          const current = yield* currentAccess(params.jamId);
          const updated = yield* patchAccess(params.jamId, (entry) => ({
            ...entry,
            joinPolicy: policy as ThreadAccess["joinPolicy"],
          }));
          return {
            jamId: params.jamId,
            policy: updated.joinPolicy,
            previous: current.joinPolicy,
          };
        }),
      )
      .handle("leaveThread", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            memberIds: current.memberIds.filter(
              (id) => id !== world.people.casey.id,
            ),
          }));
          return {
            ok: true,
            jamId: params.jamId,
            memberIds: updated.memberIds,
          };
        }),
      )
      .handle("inviteThreadMembers", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const invited = listValue(input, "userIds") ?? [
            world.people.priya.id,
          ];
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            memberIds: [...new Set([...current.memberIds, ...invited])],
          }));
          return {
            jamId: params.jamId,
            invited: invited.map(memberSummary),
            memberIds: updated.memberIds,
          };
        }),
      )
      .handle("removeThreadMembers", ({ params, query }) =>
        Effect.gen(function* () {
          const requested = (query as Record<string, unknown>).userIds;
          const removed = Array.isArray(requested)
            ? requested.filter((id): id is string => typeof id === "string")
            : [world.people.priya.id];
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            memberIds: current.memberIds.filter((id) => !removed.includes(id)),
          }));
          return {
            ok: true,
            jamId: params.jamId,
            memberIds: updated.memberIds,
          };
        }),
      )
      .handle("setThreadOwner", ({ params, payload }) =>
        Effect.gen(function* () {
          const ownerId = stringValue(
            fields(payload),
            "userId",
            world.people.alex.id,
          );
          if (!person(ownerId)) return yield* missing("members", ownerId);
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            ownerId,
          }));
          return {
            jamId: params.jamId,
            owner: memberSummary(updated.ownerId),
          };
        }),
      )
      .handle("read", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            unread: false,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            unreadCount: updated.unread ? 1 : 0,
          };
        }),
      )
      .handle("unread", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            unread: true,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            unreadCount: updated.unread ? 1 : 0,
          };
        }),
      )
      .handle("settle", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            settled: true,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            state: updated.settled ? "settled" : "unsettled",
          };
        }),
      )
      .handle("unsettle", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            settled: false,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            state: updated.settled ? "settled" : "unsettled",
          };
        }),
      )
      .handle("unsubscribeThread", ({ params }) =>
        Effect.gen(function* () {
          const updated = yield* patchAccess(params.jamId, (current) => ({
            ...current,
            subscribed: false,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            subscribed: updated.subscribed,
          };
        }),
      )
      .handle("createSideThread", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const title = stringValue(input, "title", "Follow-up work");
          const side = new ThreadCard({
            ...fallbackThread,
            id: JamId.make(newId("jam")),
            title,
            titleCustom: true,
            threadNumber: 44,
            projectId: projectOf(params.jamId),
            pulls: [],
            hasUnreads: false,
            preview: stringValue(
              input,
              "preview",
              `Side thread of ${params.jamId}`,
            ),
            createdAt: activity(),
            updatedAt: activity(),
            lastActivityAt: activity(),
            sortActivityAt: activity(),
          });
          yield* Ref.update(threads, (rows) => [side, ...rows]);
          yield* Ref.update(access, (rows) => [
            ...rows,
            {
              ...accessTemplate(side.id),
            },
          ]);
          return { ...threadJSON(side), parentJamId: params.jamId };
        }),
      )
      .handle("linkSlack", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const linked = {
            linked: true,
            active: true,
            channelId: stringValue(input, "channelId", "C_SAMPLE_WEB"),
            channelName: stringValue(input, "channelName", "web-releases"),
          };
          yield* patchAccess(params.jamId, (current) => ({
            ...current,
            slack: linked,
          }));
          return { jamId: params.jamId, ...linked, provider: "Slack" };
        }),
      )
      .handle("setSlackActive", ({ params, payload }) =>
        Effect.gen(function* () {
          const active = booleanValue(fields(payload), "active", true);
          const current = yield* currentAccess(params.jamId);
          const slack = {
            linked: current.slack?.linked ?? true,
            active,
            channelId: current.slack?.channelId ?? "C_SAMPLE_WEB",
            channelName: current.slack?.channelName ?? "web-releases",
          };
          yield* patchAccess(params.jamId, (entry) => ({ ...entry, slack }));
          return { jamId: params.jamId, ...slack, provider: "Slack" };
        }),
      )
      .handle("takeover", ({ params }) =>
        Effect.gen(function* () {
          currentAccess(params.jamId);
          yield* patchAccess(params.jamId, (current) => ({
            ...current,
            ownerId: world.people.alex.id,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            owner: memberSummary(world.people.alex.id),
          };
        }),
      )
      .handle("terminalRequestDone", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(terminalRequests);
          if (!rows.some((row) => row.toolCallId === params.toolCallId)) {
            return yield* Effect.die(
              new Error(`jams: no terminal request ${params.toolCallId}`),
            );
          }
          yield* Ref.set(
            terminalRequests,
            rows.map((row) =>
              row.toolCallId === params.toolCallId
                ? { ...row, state: "done" }
                : row,
            ),
          );
          return { ok: true, toolCallId: params.toolCallId, state: "done" };
        }),
      )
      .handle("usage", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(usage);
          return {
            jamId: params.jamId,
            period: "current month",
            items: rows,
            totalUsd: rows.reduce(
              (sum, row) => sum + (row.currency === "USD" ? row.amount : 0),
              0,
            ),
          };
        }),
      )
      .handle("archive", ({ payload }) =>
        setArchived(payload.jamIds, true).pipe(
          Effect.map((outcomes) => new JamArchiveResult({ outcomes })),
        ),
      )
      .handle("unarchive", ({ payload }) =>
        setArchived(payload.jamIds, false).pipe(
          Effect.map((outcomes) => new JamBatchResult({ outcomes })),
        ),
      )
      .handle("restore", ({ payload }) =>
        setArchived(payload.jamIds, false).pipe(
          Effect.map((outcomes) => new JamBatchResult({ outcomes })),
        ),
      )
      .handle("delete", ({ payload }) =>
        batchOutcomes(payload.jamIds, () => null).pipe(
          Effect.map((outcomes) => new JamBatchResult({ outcomes })),
        ),
      )
      .handle("asks", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(adHocAsks);
          return {
            orgId: params.orgId,
            items: rows.map((ask) => ({
              ...ask,
              thread: {
                id: ask.jamId,
                title:
                  sampleThreads.find((row) => row.id === ask.jamId)?.title ??
                  null,
              },
              user: memberSummary(ask.userId),
            })),
          };
        }),
      )
      .handle("dismissAsks", ({ params, payload }) =>
        setAsks(params.orgId, payload, adHocAsks, "dismissed"),
      )
      .handle("reopenAsks", ({ params, payload }) =>
        setAsks(params.orgId, payload, adHocAsks, "open"),
      )
      .handle("counts", () =>
        Effect.gen(function* () {
          const live = (yield* organizedThreads).filter(
            (thread) => !thread.archived,
          );
          const liveIds = new Set<string>(live.map((thread) => thread.id));
          const items = (yield* Ref.get(threadFolderItems)).filter((item) =>
            liveIds.has(item.jamId),
          );
          const folderIds = [...new Set(items.map((item) => item.folderId))];
          return new ThreadCounts({
            pinned: live.filter((thread) => thread.pinned).length,
            folders: folderIds.map(
              (folderId) =>
                new FolderCount({
                  folderId: ThreadFolderId.make(folderId),
                  count: items.filter((item) => item.folderId === folderId)
                    .length,
                }),
            ),
          });
        }),
      )
      .handle("readAll", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(access);
          yield* Ref.set(
            access,
            rows.map((row) => ({ ...row, unread: false })),
          );
          return { ok: true, orgId: params.orgId };
        }),
      );
  }),
);

const threadJSON = (thread: ThreadCard) => ({
  id: thread.id,
  number: thread.threadNumber,
  title: thread.title,
  status: thread.status,
  archived: thread.archived,
  projectId: thread.projectId,
  userId: thread.userId,
  preview: thread.preview,
  hasUnreads: thread.hasUnreads,
  createdAt: DateTime.formatIso(thread.createdAt),
  updatedAt: DateTime.formatIso(thread.updatedAt),
  sortActivityAt: DateTime.formatIso(thread.sortActivityAt),
  memberIds: [],
  issues: [],
  pulls: thread.pulls.map((pull) => ({
    id: pull.id,
    repo: pull.repo,
    number: pull.number,
    title: pull.title,
    state: pull.state,
    url: pull.url,
  })),
});

const setAsks = (
  orgId: string,
  payload: unknown,
  asks: Ref.Ref<ReadonlyArray<(typeof sampleAdHocAsks)[number]>>,
  state: "open" | "dismissed",
) =>
  Effect.gen(function* () {
    const input = fields(payload);
    const ids = listValue(input, "ids") ?? listValue(input, "askIds");
    const rows = yield* Ref.get(asks);
    const updated = rows.map((row) =>
      ids === undefined || ids.includes(row.id) ? { ...row, state } : row,
    );
    yield* Ref.set(asks, updated);
    return {
      ok: true,
      orgId,
      state,
      ids: updated.filter((row) => row.state === state).map((row) => row.id),
    };
  });
