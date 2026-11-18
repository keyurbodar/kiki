import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { type AsyncResult, type Atom, AtomRegistry } from "effect/reactivity";
import { OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";

interface Captain {
  readonly id: string;
  readonly name: string;
  readonly crew: ReadonlyArray<string>;
}

const key = `captains:${orgId}`;
const listQuery = ApiClient.query("captains", "list", {
  params: { orgId: OrgId.make(orgId) },
  query: {},
  reactivityKeys: [key],
});
const create = ApiClient.mutation("captains", "create");
const update = ApiClient.mutation("captains", "update");
const deleteCaptain = ApiClient.mutation("captains", "delete");

const names = (value: unknown) =>
  (value as ReadonlyArray<Captain & { readonly face?: Captain }>).map(
    (captain) => captain.face?.name ?? captain.name,
  );

interface FacedCaptain {
  readonly id: string;
  readonly face?: {
    readonly name: string;
    readonly avatar?: { value?: string; background?: string };
  };
}

describe("captains mock", () => {
  it.effect("every read endpoint returns sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A, E>(
        atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
      ): Effect.Effect<A, E> => AtomRegistry.getResult(registry, atom);

      const list = yield* read(listQuery);
      assert.include(names(list), "Release captain");
      const captain = (list as unknown as ReadonlyArray<Captain>)[0];
      assert.isDefined(captain);

      const detail = yield* read(
        ApiClient.query("captains", "get", {
          params: { orgId, jamId: captain?.id ?? "jam_sample_cap1" },
        }),
      );
      assert.equal((detail as Captain).id, captain?.id);

      const library = yield* read(
        ApiClient.query("captains", "listLibrary", { params: { orgId } }),
      );
      assert.isAbove((library as ReadonlyArray<unknown>).length, 0);

      const crew = yield* read(
        ApiClient.query("captains", "crew", {
          params: { orgId, jamId: captain?.id ?? "jam_sample_cap1" },
        }),
      );
      assert.isAbove((crew as ReadonlyArray<unknown>).length, 0);
    }),
  );

  it.effect("create, update and delete refresh the list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listQuery);
      yield* AtomRegistry.getResult(registry, listQuery);

      registry.set(create, {
        params: { orgId },
        payload: { name: "QA captain", alias: "qa", description: "Owns QA." },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, create);
      const afterCreate = yield* AtomRegistry.getResult(registry, listQuery, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterCreate), "QA captain");

      registry.set(update, {
        params: { orgId, jamId: (created as Captain).id },
        payload: { name: "QA lead" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, update);
      const afterUpdate = yield* AtomRegistry.getResult(registry, listQuery, {
        suspendOnWaiting: true,
      });
      assert.include(names(afterUpdate), "QA lead");

      registry.set(deleteCaptain, {
        params: { orgId, jamId: (created as Captain).id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteCaptain);
      const afterDelete = yield* AtomRegistry.getResult(registry, listQuery, {
        suspendOnWaiting: true,
      });
      assert.notInclude(names(afterDelete), "QA lead");
    }),
  );

  it.effect("crew, access, membership and promotion mutations work", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const jamId = "jam_sample_cap1";
      const threadId = threads.checkoutTest.id;
      type Endpoint =
        | "uploadImage"
        | "uploadLibraryImage"
        | "removeLibraryImage"
        | "setCaptainAccess"
        | "joinCrew"
        | "leaveCrew"
        | "moveCrew"
        | "setCaptainHidden"
        | "addCaptainMembers"
        | "removeCaptainMembers"
        | "setCaptainOwner"
        | "promoteFolder"
        | "promoteThread"
        | "leaveCaptain"
        | "demote";
      const mutate = <A, Args>(endpoint: Endpoint, args: Args) => {
        const atom = ApiClient.mutation("captains", endpoint);
        registry.set(atom, args as never);
        return AtomRegistry.getResult(registry, atom) as Effect.Effect<
          A,
          never
        >;
      };

      const uploaded = yield* mutate<{ id: string }, unknown>("uploadImage", {
        params: { orgId },
        payload: { name: "Banner", jamId },
      });
      assert.isString(uploaded.id);

      const libraryImage = yield* mutate<{ id: string }, unknown>(
        "uploadLibraryImage",
        {
          params: { orgId },
          payload: { name: "Library image" },
        },
      );
      const removed = yield* mutate<{ ok: boolean }, unknown>(
        "removeLibraryImage",
        {
          params: { orgId, imageId: libraryImage.id },
        },
      );
      assert.isTrue(removed.ok);

      const access = yield* mutate<{ access: string }, unknown>(
        "setCaptainAccess",
        {
          params: { orgId, jamId },
          payload: { access: "members" },
        },
      );
      assert.equal(access.access, "members");

      const joined = yield* mutate<{ ok: boolean }, unknown>("joinCrew", {
        params: { orgId, jamId },
        payload: { threadId: threads.rateLimit.id },
      });
      assert.isTrue(joined.ok);

      const left = yield* mutate<{ ok: boolean }, unknown>("leaveCrew", {
        params: { orgId, jamId, threadId },
      });
      assert.isTrue(left.ok);

      const moved = yield* mutate<{ toJamId: string }, unknown>("moveCrew", {
        params: { orgId, jamId, threadId: threads.darkMode.id },
        payload: { jamId: "jam_sample_cap2" },
      });
      assert.equal(moved.toJamId, "jam_sample_cap2");

      const hidden = yield* mutate<{ hidden: boolean }, unknown>(
        "setCaptainHidden",
        {
          params: { orgId, jamId },
          payload: { hidden: true },
        },
      );
      assert.isTrue(hidden.hidden);

      const added = yield* mutate<
        { memberIds: ReadonlyArray<string> },
        unknown
      >("addCaptainMembers", {
        params: { orgId, jamId },
        payload: { memberIds: ["user_sample_jordan"] },
      });
      assert.include(added.memberIds, "user_sample_jordan");
      const removedMember = yield* mutate<
        { memberIds: ReadonlyArray<string> },
        unknown
      >("removeCaptainMembers", {
        params: { orgId, jamId },
        query: { memberId: "user_sample_jordan" },
      });
      assert.include(removedMember.memberIds, "user_sample_jordan");

      const owner = yield* mutate<{ ownerId: string }, unknown>(
        "setCaptainOwner",
        {
          params: { orgId, jamId },
          payload: { ownerId: "user_sample_sam" },
        },
      );
      assert.equal(owner.ownerId, "user_sample_sam");

      const promotedFolder = yield* mutate<Captain, unknown>("promoteFolder", {
        params: { orgId },
        payload: { folderId: "fld_sample_release" },
      });
      assert.isString(promotedFolder.id);
      const promotedThread = yield* mutate<Captain, unknown>("promoteThread", {
        params: { orgId },
        payload: { threadId: threads.paginate.id },
      });
      assert.isString(promotedThread.id);

      const leftCaptain = yield* mutate<{ ok: boolean }, unknown>(
        "leaveCaptain",
        {
          params: { orgId, jamId: "jam_sample_cap2" },
        },
      );
      assert.isTrue(leftCaptain.ok);

      const demoted = yield* mutate<{ captainId: string }, unknown>("demote", {
        params: { orgId, jamId: promotedFolder.id },
      });
      assert.equal(demoted.captainId, promotedFolder.id);
    }),
  );
});

describe("captains misses", () => {
  it.effect(
    "answers the 404 the crew mutations declare for an unknown thread",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const joinCrew = ApiClient.mutation("captains", "joinCrew");
        registry.set(joinCrew, {
          params: { orgId, jamId: "jam_sample_cap1" },
          payload: { threadId: "jam_nobody" },
        });
        const joinError = yield* AtomRegistry.getResult(
          registry,
          joinCrew,
        ).pipe(Effect.flip);
        assert.instanceOf(joinError, HttpApiError.NotFound);

        const promoteThread = ApiClient.mutation("captains", "promoteThread");
        registry.set(promoteThread, {
          params: { orgId },
          payload: { threadId: "jam_nobody" },
        });
        const promoteError = yield* AtomRegistry.getResult(
          registry,
          promoteThread,
        ).pipe(Effect.flip);
        assert.instanceOf(promoteError, HttpApiError.NotFound);
      }),
  );
});

describe("captains payload spellings", () => {
  it.effect(
    "accepts snake_case thread_id and folder_id from Capy's client",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const promoteThread = ApiClient.mutation("captains", "promoteThread");
        registry.set(promoteThread, {
          params: { orgId },
          payload: { thread_id: "jam_sample_0004" },
          reactivityKeys: [],
        } as never);
        const fromThread = (yield* AtomRegistry.getResult(
          registry,
          promoteThread,
        )) as { crew: ReadonlyArray<string> };
        assert.deepStrictEqual(fromThread.crew, ["jam_sample_0004"]);

        const promoteFolder = ApiClient.mutation("captains", "promoteFolder");
        registry.set(promoteFolder, {
          params: { orgId },
          payload: { folder_id: "fld_sample_research" },
          reactivityKeys: [],
        } as never);
        const fromFolder = (yield* AtomRegistry.getResult(
          registry,
          promoteFolder,
        )) as { name: string };
        assert.strictEqual(fromFolder.name, "Research");
      }),
  );
});

describe("a Captain's face", () => {
  it.effect("reads the same on the list row and the detail endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const read = <A, E>(
        atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
      ): Effect.Effect<A, E> => AtomRegistry.getResult(registry, atom);

      const list = (yield* read(listQuery)) as ReadonlyArray<FacedCaptain>;
      const captain = list[0];
      assert.isDefined(captain);

      const detail = (yield* read(
        ApiClient.query("captains", "get", {
          params: { orgId, jamId: captain?.id ?? "jam_sample_cap1" },
        }),
      )) as FacedCaptain;

      assert.deepStrictEqual(detail.face?.avatar, captain?.face?.avatar);
      assert.strictEqual(detail.face?.name, captain?.face?.name);
    }),
  );
});
