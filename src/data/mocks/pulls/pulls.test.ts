import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { Atom, AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, pulls, threads } from "../fixtures/world.ts";

interface Pull {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly body: string;
  readonly autoMerge: boolean;
}

const pullId = pulls[0]!.id;
const key = `pulls:${orgId}`;
const detailKey = `pulls:${orgId}:${pullId}`;

const listAtom = ApiClient.query("pulls", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const getAtom = Atom.family((id: string) =>
  ApiClient.query("pulls", "get", {
    params: { orgId, pullId: id },
    reactivityKeys: [`pulls:${orgId}:${id}`],
  }),
);
const labelsAtom = ApiClient.query("pulls", "labels", {
  params: { orgId, pullId },
  reactivityKeys: [detailKey],
});
const reviewersAtom = ApiClient.query("pulls", "reviewers", {
  params: { orgId, pullId },
  reactivityKeys: [detailKey],
});
const viewedFilesAtom = ApiClient.query("pulls", "viewedFiles", {
  params: { orgId, pullId },
  reactivityKeys: [detailKey],
});
const threadsAtom = ApiClient.query("pulls", "threads", {
  params: { orgId, pullId },
  reactivityKeys: [detailKey],
});

const createPull = ApiClient.mutation("pulls", "create");
const editBody = ApiClient.mutation("pulls", "editBody");
const setAutoMerge = ApiClient.mutation("pulls", "setAutoMerge");
const mergePull = ApiClient.mutation("pulls", "merge");
const reopenPull = ApiClient.mutation("pulls", "reopen");
const closePull = ApiClient.mutation("pulls", "close");
const publishAssets = ApiClient.mutation("pulls", "publishAssets");
const requestReview = ApiClient.mutation("pulls", "requestReview");
const updateBranch = ApiClient.mutation("pulls", "updateBranch");
const setLabel = ApiClient.mutation("pulls", "setLabel");
const setReviewer = ApiClient.mutation("pulls", "setReviewer");
const setFileViewed = ApiClient.mutation("pulls", "setFileViewed");
const linkThread = ApiClient.mutation("pulls", "linkThread");
const comment = ApiClient.mutation("pulls", "comment");
const resolveComment = ApiClient.mutation("pulls", "resolveComment");
const setDraft = ApiClient.mutation("pulls", "setDraft");
const updateFinding = ApiClient.mutation("pulls", "updateFinding");
const submitReview = ApiClient.mutation("pulls", "submitReview");
const dismissReview = ApiClient.mutation("pulls", "dismissReview");
const removeLocalPull = ApiClient.mutation("pulls", "removeLocalPull");
const unlinkThread = ApiClient.mutation("pulls", "unlinkThread");

const ids = (value: unknown) =>
  (value as ReadonlyArray<{ id: string }>).map((row) => row.id);

const titles = (value: unknown) =>
  (value as ReadonlyArray<{ title: string }>).map((row) => row.title);

describe("pulls mock", () => {
  it.effect("serves every pull read endpoint with consistent data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A>(atom: Parameters<typeof AtomRegistry.getResult>[1]) =>
        AtomRegistry.getResult(registry, atom as never) as Effect.Effect<A>;

      const list = yield* read<ReadonlyArray<Pull>>(listAtom);
      assert.isAbove(list.length, 0);
      assert.include(
        list.map((pull) => pull.number),
        pulls[0]!.number,
      );

      const detail = yield* read<Pull>(getAtom(pullId));
      assert.equal(detail.id, pullId);
      assert.equal(detail.title, pulls[0]!.title);

      const local = yield* read<ReadonlyArray<{ id: string }>>(
        ApiClient.query("pulls", "localPullsForThread", {
          params: { orgId, jamId: threads.checkoutTest.id },
        }),
      );
      const forThread = yield* read<ReadonlyArray<{ id: string }>>(
        ApiClient.query("pulls", "forThread", {
          params: { orgId, jamId: pulls[0]!.threadId! },
        }),
      );
      const byNumber = yield* read<Pull>(
        ApiClient.query("pulls", "byNumber", {
          params: { orgId },
          payload: { number: pulls[0]!.number },
        }),
      );
      const find = yield* read<ReadonlyArray<Pull>>(
        ApiClient.query("pulls", "find", {
          params: { orgId },
          query: { q: "dark mode" },
        }),
      );
      const publicPulls = yield* read<ReadonlyArray<Pull>>(
        ApiClient.query("pulls", "public", { params: { orgId }, query: {} }),
      );
      assert.isAbove(local.length, 0);
      assert.isAbove(forThread.length, 0);
      assert.equal(byNumber.id, pullId);
      assert.isAbove(find.length, 0);
      assert.isAbove(publicPulls.length, 0);

      const activity = yield* read<ReadonlyArray<{ id: string }>>(
        ApiClient.query("pulls", "activity", { params: { orgId, pullId } }),
      );
      const orgActivity = yield* read<ReadonlyArray<{ id: string }>>(
        ApiClient.query("pulls", "orgActivity", {
          params: { orgId },
          query: {},
        }),
      );
      const hourly = yield* read<ReadonlyArray<{ hour: string }>>(
        ApiClient.query("pulls", "orgHourlyActivity", {
          params: { orgId },
          query: {},
        }),
      );
      const branches = yield* read<ReadonlyArray<{ name: string }>>(
        ApiClient.query("pulls", "branches", { params: { orgId }, query: {} }),
      );
      const checkNames = yield* read<ReadonlyArray<string>>(
        ApiClient.query("pulls", "checkNames", {
          params: { orgId },
          query: {},
        }),
      );
      const checks = yield* read<ReadonlyArray<{ name: string }>>(
        ApiClient.query("pulls", "checks", { params: { orgId, pullId } }),
      );
      assert.isAbove(activity.length, 0);
      assert.isAbove(orgActivity.length, 0);
      assert.isAbove(hourly.length, 0);
      assert.isAbove(branches.length, 0);
      assert.isAbove(checkNames.length, 0);
      assert.isAbove(checks.length, 0);

      const commits = yield* read<{ sha: string }>(
        ApiClient.query("pulls", "commitDiff", {
          params: { orgId, pullId, sha: "c2f8a10d9b47" },
        }),
      );
      const compare = yield* read<{ base: string; head: string }>(
        ApiClient.query("pulls", "compareDiff", {
          params: { orgId, pullId, base: "main", head: "feat/dark-mode" },
        }),
      );
      const diff = yield* read<{ files: ReadonlyArray<{ path: string }> }>(
        ApiClient.query("pulls", "diff", { params: { orgId, pullId } }),
      );
      const fileUrls = yield* read<ReadonlyArray<{ url: string }>>(
        ApiClient.query("pulls", "fileUrls", {
          params: { orgId, pullId },
          query: {},
        }),
      );
      const image = yield* read<{ url: string }>(
        ApiClient.query("pulls", "image", {
          params: { orgId, pullId },
          query: {},
        }),
      );
      assert.equal(commits.sha, "c2f8a10d9b47");
      assert.equal(compare.base, "main");
      assert.isAbove(diff.files.length, 0);
      assert.isAbove(fileUrls.length, 0);
      assert.isNotEmpty(image.url);

      const labels = yield* read<ReadonlyArray<{ id: string }>>(labelsAtom);
      const reviewers =
        yield* read<ReadonlyArray<{ id: string }>>(reviewersAtom);
      const viewedFiles =
        yield* read<ReadonlyArray<{ path: string }>>(viewedFilesAtom);
      const linkedThreads =
        yield* read<ReadonlyArray<{ id: string }>>(threadsAtom);
      assert.isAbove(labels.length, 0);
      assert.isAbove(reviewers.length, 0);
      assert.isAbove(viewedFiles.length, 0);
      assert.isAbove(linkedThreads.length, 0);

      const review = yield* read<{ state: string }>(
        ApiClient.query("pulls", "review", { params: { orgId, pullId } }),
      );
      const reviewSkip = yield* read<{ skipped: boolean }>(
        ApiClient.query("pulls", "reviewSkip", { params: { orgId, pullId } }),
      );
      const relatives = yield* read<ReadonlyArray<{ pullId: string }>>(
        ApiClient.query("pulls", "stackRelatives", {
          params: { orgId, pullId },
          query: {},
        }),
      );
      const tree = yield* read<{ nodes: ReadonlyArray<{ pullId: string }> }>(
        ApiClient.query("pulls", "stackTree", { params: { orgId, pullId } }),
      );
      const summary = yield* read<{ summary: string }>(
        ApiClient.query("pulls", "summary", {
          params: { orgId, pullId },
          query: {},
        }),
      );
      const latest = yield* read<{ summary: string }>(
        ApiClient.query("pulls", "summaryLatest", {
          params: { orgId, pullId },
        }),
      );
      assert.isNotEmpty(review.state);
      assert.isTrue(reviewSkip.skipped);
      assert.isAbove(relatives.length, 0);
      assert.isAbove(tree.nodes.length, 0);
      assert.isNotEmpty(summary.summary);
      assert.equal(latest.summary, summary.summary);
    }),
  );

  it.effect("refreshes mutations through their shared reactivity keys", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(getAtom(pullId));
      registry.mount(labelsAtom);
      registry.mount(reviewersAtom);
      registry.mount(viewedFilesAtom);
      registry.mount(threadsAtom);
      yield* AtomRegistry.getResult(registry, listAtom);
      yield* AtomRegistry.getResult(registry, getAtom(pullId));

      registry.set(createPull, {
        params: { orgId },
        payload: {
          repo: "acme/web",
          title: "Handle empty checkout carts",
          headRef: "fix/empty-cart",
          baseRef: "main",
          threadId: threads.checkoutTest.id,
        },
        reactivityKeys: [key],
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        createPull,
      )) as Pull;
      assert.isAbove(created.number, pulls[0]!.number);
      const afterCreate = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.include(titles(afterCreate), "Handle empty checkout carts");

      registry.set(editBody, {
        params: { orgId, pullId: created.id },
        payload: { body: "Handle the empty cart state explicitly." },
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, editBody);
      const afterEdit = (yield* AtomRegistry.getResult(
        registry,
        getAtom(created.id),
        { suspendOnWaiting: true },
      )) as Pull;
      assert.equal(afterEdit.body, "Handle the empty cart state explicitly.");

      registry.set(setAutoMerge, {
        params: { orgId, pullId },
        payload: { enabled: true },
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, setAutoMerge);
      const afterAutoMerge = (yield* AtomRegistry.getResult(
        registry,
        getAtom(pullId),
        { suspendOnWaiting: true },
      )) as Pull;
      assert.isTrue(afterAutoMerge.autoMerge);

      registry.set(setLabel, {
        params: { orgId, pullId },
        payload: { labelId: "lbl_sample_bug" },
        reactivityKeys: [detailKey],
      });
      const afterLabel = yield* AtomRegistry.getResult(registry, setLabel);
      assert.include(ids(afterLabel), "lbl_sample_bug");

      registry.set(setReviewer, {
        params: { orgId, pullId },
        payload: { reviewerId: "user_sample_casey" },
        reactivityKeys: [detailKey],
      });
      const afterReviewer = yield* AtomRegistry.getResult(
        registry,
        setReviewer,
      );
      assert.isTrue(
        (afterReviewer as { id: string }).id === "user_sample_casey",
      );

      registry.set(setFileViewed, {
        params: { orgId, pullId },
        payload: { path: "test/checkout/retry.test.ts", viewed: true },
        reactivityKeys: [detailKey],
      });
      const afterViewed = yield* AtomRegistry.getResult(
        registry,
        setFileViewed,
      );
      assert.isTrue(
        (afterViewed as ReadonlyArray<{ viewed: boolean }>).some(
          (file) => file.viewed,
        ),
      );

      registry.set(linkThread, {
        params: { orgId, pullId },
        payload: { jamId: threads.paginate.id },
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, linkThread);
      const afterLink = yield* AtomRegistry.getResult(registry, threadsAtom, {
        suspendOnWaiting: true,
      });
      assert.include(ids(afterLink), threads.paginate.id);

      registry.set(unlinkThread, {
        params: { orgId, pullId, jamId: threads.paginate.id },
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, unlinkThread);
      const afterUnlink = yield* AtomRegistry.getResult(registry, threadsAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(ids(afterUnlink), threads.paginate.id);

      registry.set(mergePull, {
        params: { orgId, pullId },
        payload: {},
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, mergePull);
      const afterMerge = (yield* AtomRegistry.getResult(
        registry,
        getAtom(pullId),
        { suspendOnWaiting: true },
      )) as Pull;
      assert.equal(afterMerge.state, "merged");

      registry.set(reopenPull, {
        params: { orgId, pullId },
        reactivityKeys: [detailKey],
      });
      yield* AtomRegistry.getResult(registry, reopenPull);
      const afterReopen = (yield* AtomRegistry.getResult(
        registry,
        getAtom(pullId),
        { suspendOnWaiting: true },
      )) as Pull;
      assert.equal(afterReopen.state, "ready");
    }),
  );

  it.effect("applies the remaining pull actions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();

      registry.set(publishAssets, {
        params: { orgId, pullId },
        payload: { assets: ["file_sample_chart"] },
      });
      const published = yield* AtomRegistry.getResult(registry, publishAssets);
      assert.equal((published as { published: number }).published, 1);

      registry.set(comment, {
        params: { orgId, pullId },
        payload: { body: "Please merge after CI is green." },
      });
      const added = (yield* AtomRegistry.getResult(registry, comment)) as {
        id: string;
      };
      assert.isNotEmpty(added.id);

      registry.set(resolveComment, {
        params: { orgId, pullId, commentId: added.id },
        payload: {},
      });
      const resolved = yield* AtomRegistry.getResult(registry, resolveComment);
      assert.isTrue((resolved as { resolved: boolean }).resolved);

      registry.set(setDraft, {
        params: { orgId, pullId },
        payload: { draft: true },
      });
      const draft = yield* AtomRegistry.getResult(registry, setDraft);
      assert.equal((draft as Pull).state, "draft");

      registry.set(updateFinding, {
        params: { orgId, pullId, findingId: "find_sample_1" },
        payload: { status: "resolved" },
      });
      const finding = yield* AtomRegistry.getResult(registry, updateFinding);
      assert.equal((finding as { status: string }).status, "resolved");

      registry.set(submitReview, {
        params: { orgId, pullId },
        payload: { state: "approved", body: "Ship it." },
      });
      const submitted = (yield* AtomRegistry.getResult(
        registry,
        submitReview,
      )) as { githubReviewId: string };
      assert.isNotEmpty(submitted.githubReviewId);

      registry.set(dismissReview, {
        params: { orgId, pullId, githubReviewId: submitted.githubReviewId },
        payload: {},
      });
      const dismissed = yield* AtomRegistry.getResult(registry, dismissReview);
      assert.equal((dismissed as { state: string }).state, "dismissed");

      registry.set(requestReview, {
        params: { orgId, pullId },
        payload: { reviewerId: "user_sample_priya" },
      });
      const requested = yield* AtomRegistry.getResult(registry, requestReview);
      assert.isAbove((requested as ReadonlyArray<unknown>).length, 0);

      registry.set(updateBranch, { params: { orgId, pullId } });
      const updated = yield* AtomRegistry.getResult(registry, updateBranch);
      assert.isTrue((updated as { ok: boolean }).ok);

      registry.set(closePull, {
        params: { orgId, pullId },
        payload: {},
      });
      const closed = yield* AtomRegistry.getResult(registry, closePull);
      assert.equal((closed as Pull).state, "closed");

      registry.set(removeLocalPull, {
        params: {
          orgId,
          jamId: threads.checkoutTest.id,
          id: "localpull_mock_1",
        },
      });
      const removed = yield* AtomRegistry.getResult(registry, removeLocalPull);
      assert.isTrue((removed as { ok: boolean }).ok);
    }),
  );
});
