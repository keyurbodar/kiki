import { Effect, Ref } from "effect";
import { fields, type JamRow, MockDb, newId, notFound } from "../db/MockDb.ts";
import {
  isoMinutesAgo,
  people,
  projects,
  threads,
  xinPull,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  checksStateFor,
  defaultLocalPull,
  pullActivity,
  pullBranches,
  pullChecksFor,
  pullChecksNames,
  pullComments,
  pullCommitDiff,
  pullCompareDiff,
  pullDetail,
  pullDiff,
  pullFileUrls,
  pullFindings,
  pullHourlyActivity,
  pullImage,
  pullIssues,
  pullLabels,
  pullReview,
  pullReviewers,
  pullReviewSkip,
  pullReviews,
  pullStackRelatives,
  pullStackTree,
  pullSummaries,
  pullThreads,
  viewedPullFiles,
  xinPullActivity,
  xinPullBody,
  xinPullChecks,
  xinPullComments,
  xinPullCommits,
  xinPullDiff,
  xinPullFiles,
  xinPullFileUrls,
  xinPullFindings,
  xinPullHeadSha,
  xinPullLabels,
  xinPullReview,
  xinPullReviewers,
  xinPullViewedFiles,
} from "./fixtures.ts";
import { sampleOrgActivity } from "./org-activity.ts";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const flag = (value: unknown): boolean => value === true || value === "true";

const queryText = (query: unknown, key: string): string | undefined =>
  text(fields(query)[key]);

/** The thread chip a pull row prints, as the API carries it on each pull. */
const threadChip = (threadId: string | null) => {
  if (threadId === null) return null;
  const thread = Object.values(threads).find(
    (candidate) => candidate.id === threadId,
  );
  if (thread === undefined) return null;
  const project = Object.values(projects).find(
    (candidate) => candidate.id === thread.projectId,
  );
  return {
    id: thread.id,
    number: thread.number,
    title: thread.title,
    projectCode: project?.code ?? null,
    archived: "archived" in thread && thread.archived === true,
  };
};

export const PullsMock = mockGroup("pulls", (handlers) =>
  Effect.gen(function* () {
    const { issueLabels, jams, pulls } = yield* MockDb;
    const localPulls = yield* Ref.make([
      { ...defaultLocalPull, threadId: threads.checkoutTest.id },
      {
        ...defaultLocalPull,
        id: "localpull_mock_2",
        number: 214,
        title: "Polish the dark mode toggle",
        state: "draft",
        threadId: threads.darkMode.id,
        updatedAt: isoMinutesAgo(18),
      },
    ]);
    const bodies = yield* Ref.make<Readonly<Record<string, string>>>({
      [xinPull.id]: xinPullBody,
    });
    const autoMerge = yield* Ref.make<Readonly<Record<string, boolean>>>({});
    const autoMergeMethods = yield* Ref.make<Readonly<Record<string, string>>>(
      {},
    );
    const updatedBranches = yield* Ref.make<ReadonlyArray<string>>([]);
    const comments = yield* Ref.make([...pullComments]);
    const xinComments: Array<Record<string, unknown>> = [...xinPullComments];
    const findings = yield* Ref.make([...pullFindings, ...xinPullFindings]);
    const reviewers = yield* Ref.make([...pullReviewers]);
    const reviews = yield* Ref.make([...pullReviews]);
    const labels = yield* Ref.make<
      ReadonlyArray<{ id: string; name: string; color: string }>
    >([...pullLabels]);
    const xinLabels: Array<{ id: string; name: string; color: string }> = [
      ...xinPullLabels,
    ];
    const xinReviewers: Array<(typeof pullReviewers)[number]> = [
      ...xinPullReviewers,
    ];
    const xinViewed: Array<{
      path: string;
      viewed: boolean;
      viewedAt: string | null;
    }> = [...xinPullViewedFiles];
    const linkedThreads = yield* Ref.make<ReadonlyArray<JamRow>>([
      ...pullThreads,
    ]);
    const viewedFiles = yield* Ref.make([...viewedPullFiles]);

    const findPull = (pullId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(pulls);
        const row = rows.find((candidate) => candidate.id === pullId);
        if (!row) return yield* notFound("pulls", pullId);
        return row;
      });

    const detailOf = (pullId: string) =>
      Effect.gen(function* () {
        const row = yield* findPull(pullId);
        const detail = pullDetail(row.id) ?? {
          issueIds: [] as ReadonlyArray<string>,
          authorLogin: people.alex.githubLogin,
          authorName: "Alex Morgan",
          authorAvatarUrl: `https://example.com/avatars/${people.alex.id}.png`,
          filesChanged: 0,
          commentsCount: 0,
          commitsCount: 0,
          autoMerge: false,
        };
        return {
          ...detail,
          id: row.id,
          repo: row.repo,
          repoFullName: row.repo,
          number: row.number,
          title: row.title,
          state: row.state,
          authorId: row.authorId,
          authorLogin: detail.authorLogin,
          authorName: detail.authorName,
          authorAvatarUrl: detail.authorAvatarUrl,
          headRef: row.headRef,
          baseRef: row.baseRef,
          additions: row.additions,
          deletions: row.deletions,
          labels: row.id === xinPull.id ? xinLabels : [],
          threadId: row.threadId,
          thread: threadChip(row.threadId),
          ...(row.id === xinPull.id
            ? {
                headSha: xinPullHeadSha,
                createdAt: isoMinutesAgo(5 * 24 * 60),
                filesChanged: xinPullFiles.length,
                commitsCount: xinPullCommits.length,
                commentsCount: xinPullComments.length,
                mergeable: true,
                mergeableState: "clean",
              }
            : {}),
          updatedAt: row.updatedAt,
          url: `https://github.com/${row.repo}/pull/${row.number}`,
          body:
            (yield* Ref.get(bodies))[pullId] ??
            (row.state === "draft"
              ? "Working through the changes before marking this ready."
              : `Updates ${row.headRef} for the ${row.baseRef} branch.`),
          draft: row.state === "draft",
          mergedAt: row.state === "merged" ? row.updatedAt : null,
          closedAt:
            row.state === "merged" || row.state === "closed"
              ? row.updatedAt
              : null,
          reviewDecision: row.state === "ready" ? "review_required" : null,
          issues: pullIssues.filter((issue) =>
            detail.issueIds.includes(issue.id),
          ),
          mergeableState: (yield* Ref.get(updatedBranches)).includes(pullId)
            ? "clean"
            : "mergeableState" in detail
              ? detail.mergeableState
              : "clean",
          checksState:
            row.id === xinPull.id
              ? checksStateFor(xinPullChecks)
              : checksStateFor(pullChecksFor(row.number)),
          autoMerge: (yield* Ref.get(autoMerge))[pullId] ?? detail.autoMerge,
          autoMergeMethod: (yield* Ref.get(autoMergeMethods))[pullId] ?? null,
        };
      });

    const setPullState = (pullId: string, state: string) =>
      Effect.gen(function* () {
        const current = yield* findPull(pullId);
        const updated = {
          ...current,
          state: state as (typeof current)["state"],
          updatedAt: isoMinutesAgo(0),
        };
        yield* Ref.set(
          pulls,
          (yield* Ref.get(pulls)).map((row) =>
            row.id === pullId ? updated : row,
          ),
        );
        return yield* detailOf(pullId);
      });

    return handlers
      .handle("localPullsForThread", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(localPulls);
          return rows.filter((row) => row.threadId === params.jamId);
        }),
      )
      .handle("removeLocalPull", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(localPulls);
          if (!rows.some((row) => row.id === params.id)) {
            return yield* Effect.die(
              new Error(`pulls.localPulls: no row ${params.id}`),
            );
          }
          yield* Ref.set(
            localPulls,
            rows.filter((row) => row.id !== params.id),
          );
          return { ok: true };
        }),
      )
      .handle("forThread", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(pulls);
          const matching = rows
            .filter((row) => row.threadId === params.jamId)
            .map((row) => row.id);
          return yield* Effect.forEach(matching, detailOf);
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(pulls);
          const row = {
            id: newId("pr"),
            repo: text(input.repo) ?? "acme/web",
            number: Math.max(...rows.map((candidate) => candidate.number)) + 1,
            title: text(input.title) ?? "New pull request",
            state: flag(input.draft) ? ("draft" as const) : ("ready" as const),
            authorId: people.alex.id,
            headRef: text(input.headRef) ?? "feat/new-change",
            baseRef: text(input.baseRef) ?? "main",
            additions: 0,
            deletions: 0,
            threadId: text(input.threadId) ?? null,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(pulls, [...rows, row]);
          const body = text(input.body);
          if (body) {
            yield* Ref.update(bodies, (current) => ({
              ...current,
              [row.id]: body,
            }));
          }
          return yield* detailOf(row.id);
        }),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(pulls);
          const state = queryText(query, "state");
          const repo = queryText(query, "repo");
          const search = queryText(query, "search")?.toLowerCase();
          const limit = Number(queryText(query, "limit") ?? rows.length);
          const matching = rows
            .filter((row) => !state || row.state === state)
            .filter((row) => !repo || row.repo === repo)
            .filter((row) =>
              search ? row.title.toLowerCase().includes(search) : true,
            )
            .slice(0, Number.isFinite(limit) ? limit : rows.length)
            .map((row) => row.id);
          return yield* Effect.forEach(matching, detailOf);
        }),
      )
      .handle("get", ({ params }) => detailOf(params.pullId))
      .handle("editBody", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          yield* Ref.update(bodies, (current) => ({
            ...current,
            [params.pullId]: text(fields(payload).body) ?? "",
          }));
          return yield* detailOf(params.pullId);
        }),
      )
      .handle("activity", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          if (params.pullId === xinPull.id) {
            return { ...xinPullActivity, comments: xinComments };
          }
          const matching = pullActivity.filter(
            (item) => item.pullId === params.pullId,
          );
          return matching.length > 0
            ? matching
            : [
                {
                  id: `act_${params.pullId}`,
                  pullId: params.pullId,
                  type: "updated",
                  actorId: people.alex.id,
                  body: "updated the pull request",
                  createdAt: isoMinutesAgo(60),
                },
              ];
        }),
      )
      .handle("publishAssets", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const assets = fields(payload).assets;
          return {
            ok: true,
            pullId: params.pullId,
            published: Array.isArray(assets) ? assets.length : 1,
            publishedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("setAutoMerge", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const input = fields(payload);
          const enabled = flag(input.enabled);
          const method = text(input.method);
          yield* Ref.update(autoMerge, (current) => ({
            ...current,
            [params.pullId]: enabled,
          }));
          yield* Ref.update(autoMergeMethods, (current) => ({
            ...current,
            [params.pullId]: enabled ? (method ?? "squash") : "",
          }));
          return yield* detailOf(params.pullId);
        }),
      )
      .handle("checks", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findPull(params.pullId);
          return params.pullId === xinPull.id
            ? xinPullChecks
            : pullChecksFor(row.number);
        }),
      )
      .handle("close", ({ params }) => setPullState(params.pullId, "closed"))
      .handle("comment", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const input = fields(payload);
          const comment = {
            id: newId("cmt"),
            pullId: params.pullId,
            authorId: people.alex.id,
            authorLogin: people.alex.githubLogin,
            author: people.alex.githubLogin,
            body: text(input.body) ?? "Looks good to me.",
            bodyMd: text(input.body) ?? "Looks good to me.",
            kind: text(input.path) === undefined ? "issue" : "review",
            createdAt: isoMinutesAgo(0),
            authoredAt: isoMinutesAgo(0),
            updatedAt: isoMinutesAgo(0),
            resolved: false,
            path: text(input.path) ?? null,
            line: typeof input.line === "number" ? input.line : null,
          };
          if (params.pullId === xinPull.id) {
            xinComments.push(comment);
            return comment;
          }
          yield* Ref.update(comments, (current) => [...current, comment]);
          return comment;
        }),
      )
      .handle("resolveComment", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(comments);
          const xinComment = xinComments.find(
            (item) => item.id === params.commentId,
          );
          if (params.pullId === xinPull.id && xinComment !== undefined) {
            xinComment.resolved = true;
            return xinComment;
          }
          const comment = current.find((item) => item.id === params.commentId);
          if (!comment) {
            return yield* Effect.die(
              new Error(`pulls.comments: no row ${params.commentId}`),
            );
          }
          const resolved = { ...comment, resolved: true };
          yield* Ref.set(
            comments,
            current.map((item) =>
              item.id === params.commentId ? resolved : item,
            ),
          );
          return resolved;
        }),
      )
      .handle("commitDiff", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return { ...pullCommitDiff, sha: params.sha };
        }),
      )
      .handle("compareDiff", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return {
            ...pullCompareDiff,
            base: params.base,
            head: params.head,
          };
        }),
      )
      .handle("diff", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return params.pullId === xinPull.id ? xinPullDiff : pullDiff;
        }),
      )
      .handle("fileUrls", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return params.pullId === xinPull.id ? xinPullFileUrls : pullFileUrls;
        }),
      )
      .handle("setDraft", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return yield* setPullState(
            params.pullId,
            flag(fields(payload).draft) ? "draft" : "ready",
          );
        }),
      )
      .handle("updateFinding", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(findings);
          const finding = current.find((item) => item.id === params.findingId);
          if (!finding) {
            return yield* Effect.die(
              new Error(`pulls.findings: no row ${params.findingId}`),
            );
          }
          const status = text(fields(payload).status) ?? finding.status;
          const updated = { ...finding, status };
          yield* Ref.set(
            findings,
            current.map((item) =>
              item.id === params.findingId ? updated : item,
            ),
          );
          return updated;
        }),
      )
      .handle("image", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return pullImage;
        }),
      )
      .handle("labels", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          if (params.pullId === xinPull.id) return xinLabels;
          return yield* Ref.get(labels);
        }),
      )
      .handle("setLabel", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const input = fields(payload);
          const labelId = text(input.labelId) ?? "lbl_sample_bug";
          const available = yield* Ref.get(issueLabels);
          const label = available.find((item) => item.id === labelId);
          if (!label) return yield* notFound("issueLabels", labelId);
          if (params.pullId === xinPull.id) {
            if (!xinLabels.some((item) => item.id === labelId)) {
              xinLabels.push({
                id: label.id,
                name: label.name,
                color: label.color,
              });
            }
            return xinLabels;
          }
          const current = yield* Ref.get(labels);
          if (!current.some((item) => item.id === labelId)) {
            yield* Ref.set(labels, [...current, label]);
          }
          return yield* Ref.get(labels);
        }),
      )
      .handle("merge", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return yield* setPullState(params.pullId, "merged");
        }),
      )
      .handle("reopen", ({ params }) => setPullState(params.pullId, "ready"))
      .handle("review", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const rows = yield* Ref.get(findings);
          return {
            ...pullReview,
            ...(params.pullId === xinPull.id ? xinPullReview : {}),
            pullId: params.pullId,
            findings: rows.filter((row) => row.pullId === params.pullId),
          };
        }),
      )
      .handle("requestReview", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const reviewerId = text(fields(payload).reviewerId);
          const xin = params.pullId === xinPull.id;
          if (reviewerId) {
            const current = xin ? xinReviewers : yield* Ref.get(reviewers);
            if (!current.some((item) => item.id === reviewerId)) {
              const person = Object.values(people).find(
                (candidate) => candidate.id === reviewerId,
              );
              if (!person) {
                return yield* Effect.die(
                  new Error(`pulls.reviewers: no member ${reviewerId}`),
                );
              }
              const added = {
                id: person.id,
                login: person.githubLogin,
                name: `${person.firstName} ${person.lastName}`,
                role: "reviewer",
                state: "pending",
                approved: false,
              };
              if (xin) xinReviewers.push(added);
              else yield* Ref.set(reviewers, [...current, added]);
            }
          }
          return xin ? xinReviewers : yield* Ref.get(reviewers);
        }),
      )
      .handle("reviewSkip", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return { ...pullReviewSkip, pullId: params.pullId };
        }),
      )
      .handle("reviewers", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          if (params.pullId === xinPull.id) return xinReviewers;
          return yield* Ref.get(reviewers);
        }),
      )
      .handle("setReviewer", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const reviewerId = text(fields(payload).reviewerId);
          if (!reviewerId) {
            return yield* Effect.die(
              new Error("pulls.setReviewer: reviewerId is required"),
            );
          }
          const xin = params.pullId === xinPull.id;
          const current = xin ? xinReviewers : yield* Ref.get(reviewers);
          const existing = current.find((item) => item.id === reviewerId);
          if (!existing) {
            const person = Object.values(people).find(
              (candidate) => candidate.id === reviewerId,
            );
            if (!person) {
              return yield* Effect.die(
                new Error(`pulls.reviewers: no member ${reviewerId}`),
              );
            }
            const added = {
              id: person.id,
              login: person.githubLogin,
              name: `${person.firstName} ${person.lastName}`,
              role: "reviewer",
              state: "pending",
              approved: false,
            };
            if (xin) xinReviewers.push(added);
            else yield* Ref.set(reviewers, [...current, added]);
            return added;
          }
          return existing;
        }),
      )
      .handle("submitReview", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const input = fields(payload);
          const state = text(input.state) ?? "commented";
          const review = {
            id: newId("ghr"),
            githubReviewId: newId("ghr"),
            pullId: params.pullId,
            authorId: people.alex.id,
            authorLogin: people.alex.githubLogin,
            state,
            body: text(input.body) ?? "Reviewed the changes.",
            submittedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(reviews, (current) => [...current, review]);
          return review;
        }),
      )
      .handle("dismissReview", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(reviews);
          const review = current.find(
            (item) => item.githubReviewId === params.githubReviewId,
          );
          if (!review) {
            return yield* Effect.die(
              new Error(`pulls.reviews: no row ${params.githubReviewId}`),
            );
          }
          const dismissed = { ...review, state: "dismissed" };
          yield* Ref.set(
            reviews,
            current.map((item) =>
              item.githubReviewId === params.githubReviewId ? dismissed : item,
            ),
          );
          return dismissed;
        }),
      )
      .handle("stackRelatives", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return pullStackRelatives;
        }),
      )
      .handle("stackTree", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return { ...pullStackTree, rootPullId: params.pullId };
        }),
      )
      .handle("summary", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return (
            pullSummaries.find((item) => item.pullId === params.pullId) ??
            pullSummaries[0]
          );
        }),
      )
      .handle("summaryLatest", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return (
            pullSummaries.find((item) => item.pullId === params.pullId) ??
            pullSummaries[0]
          );
        }),
      )
      .handle("threads", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          return yield* Ref.get(linkedThreads);
        }),
      )
      .handle("linkThread", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const jamId = text(fields(payload).jamId) ?? threads.paginate.id;
          const current = yield* Ref.get(linkedThreads);
          if (current.some((item) => item.id === jamId)) return current;
          const thread = (yield* Ref.get(jams)).find(
            (candidate) => candidate.id === jamId,
          );
          if (!thread) {
            return yield* Effect.die(
              new Error(`pulls.threads: no thread ${jamId}`),
            );
          }
          const linked = {
            id: thread.id,
            number: thread.number,
            title: thread.title,
            projectId: thread.projectId,
          };
          yield* Ref.set(linkedThreads, [...current, linked]);
          return yield* Ref.get(linkedThreads);
        }),
      )
      .handle("unlinkThread", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          yield* Ref.set(
            linkedThreads,
            (yield* Ref.get(linkedThreads)).filter(
              (item) => item.id !== params.jamId,
            ),
          );
          return { ok: true };
        }),
      )
      .handle("updateBranch", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          yield* Ref.update(updatedBranches, (current) =>
            current.includes(params.pullId)
              ? current
              : [...current, params.pullId],
          );
          return {
            ok: true,
            pullId: params.pullId,
            updatedAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("viewedFiles", ({ params }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          if (params.pullId === xinPull.id) return xinViewed;
          return yield* Ref.get(viewedFiles);
        }),
      )
      .handle("setFileViewed", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findPull(params.pullId);
          const input = fields(payload);
          const path = text(input.path) ?? pullDiff.files[0]!.path;
          const viewed = flag(input.viewed);
          if (params.pullId === xinPull.id) {
            const rows = xinViewed.map((item) =>
              item.path === path
                ? {
                    ...item,
                    viewed,
                    viewedAt: viewed ? isoMinutesAgo(0) : null,
                  }
                : item,
            );
            xinViewed.splice(0, xinViewed.length, ...rows);
            return xinViewed;
          }
          const current = yield* Ref.get(viewedFiles);
          const updated = current.map((item) =>
            item.path === path
              ? { ...item, viewed, viewedAt: viewed ? isoMinutesAgo(0) : null }
              : item,
          );
          yield* Ref.set(viewedFiles, updated);
          return updated;
        }),
      )
      .handle("orgActivity", () =>
        Effect.succeed(
          sampleOrgActivity(new Date(), [
            people.alex.id,
            people.priya.id,
            people.sam.id,
          ]),
        ),
      )
      .handle("orgHourlyActivity", () => Effect.succeed(pullHourlyActivity))
      .handle("branches", () => Effect.succeed(pullBranches))
      .handle("byNumber", ({ payload }) =>
        Effect.gen(function* () {
          const number = Number(fields(payload).number);
          const repo = text(fields(payload).repo);
          const rows = yield* Ref.get(pulls);
          const row = rows.find(
            (candidate) =>
              candidate.number === number &&
              (repo === undefined || candidate.repo === repo),
          );
          if (!row) return yield* notFound("pulls", String(number));
          return yield* detailOf(row.id);
        }),
      )
      .handle("checkNames", () => Effect.succeed(pullChecksNames))
      .handle("find", ({ query }) =>
        Effect.gen(function* () {
          const search = queryText(query, "q")?.toLowerCase();
          const repo = queryText(query, "repo");
          const state = queryText(query, "state");
          const rows = yield* Ref.get(pulls);
          return rows
            .filter((row) => !repo || row.repo === repo)
            .filter((row) => !state || row.state === state)
            .filter((row) =>
              search
                ? row.title.toLowerCase().includes(search) ||
                  row.repo.toLowerCase().includes(search)
                : true,
            )
            .map((row) => pullDetail(row.id));
        }),
      )
      .handle("public", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(pulls);
          return rows
            .filter((row) => row.state !== "draft")
            .map((row) => pullDetail(row.id));
        }),
      );
  }),
);
