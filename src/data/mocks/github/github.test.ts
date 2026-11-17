import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface ReaderRepo {
  readonly id: string;
  readonly fullName: string;
  readonly private: boolean;
  readonly defaultBranch: string;
  readonly language: string;
  readonly selected: boolean;
}

interface SecondaryAccount {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly connectedAt: string;
  readonly scopes: ReadonlyArray<string>;
  readonly connected: boolean;
}

const key = `github:${orgId}`;

const reposAtom = ApiClient.query("github", "listDependencyReaderRepos", {
  params: { orgId },
  reactivityKeys: [key],
});
const secondaryAtom = ApiClient.query("github", "getGitHubSecondary", {
  params: { orgId },
  reactivityKeys: [key],
});
const disconnect = ApiClient.mutation("github", "disconnectGitHubSecondary");

describe("github mock", () => {
  it.effect("lists dependency reader repos and the secondary account", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const repos = (yield* AtomRegistry.getResult(
        registry,
        reposAtom,
      )) as ReadonlyArray<ReaderRepo>;
      const account = (yield* AtomRegistry.getResult(
        registry,
        secondaryAtom,
      )) as SecondaryAccount;

      assert.isAbove(repos.length, 0);
      assert.deepStrictEqual(
        repos.map((repo) => repo.fullName),
        [
          "acme/web",
          "acme/api",
          "acme/shared",
          "acme/docs",
          "acme/legacy-site",
        ],
      );
      assert.isTrue(repos.every((repo) => typeof repo.private === "boolean"));
      assert.isTrue(repos.every((repo) => repo.defaultBranch.length > 0));
      assert.isTrue(repos.every((repo) => repo.language.length > 0));
      assert.isTrue(repos.some((repo) => repo.selected));
      assert.isTrue(repos.some((repo) => !repo.selected));
      assert.isTrue(account.connected);
      assert.isTrue(account.login.length > 0);
      assert.isTrue(account.name.length > 0);
      assert.isTrue(account.avatarUrl.length > 0);
      assert.isTrue(account.connectedAt.length > 0);
      assert.isAbove(account.scopes.length, 0);
    }),
  );

  it.effect("refreshes the account after disconnect", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(secondaryAtom);
      const before = (yield* AtomRegistry.getResult(
        registry,
        secondaryAtom,
      )) as SecondaryAccount;
      assert.isTrue(before.connected);

      registry.set(disconnect, { params: { orgId }, reactivityKeys: [key] });
      const result = yield* AtomRegistry.getResult(registry, disconnect);
      assert.deepStrictEqual(result, { ok: true });

      const after = (yield* AtomRegistry.getResult(registry, secondaryAtom, {
        suspendOnWaiting: true,
      })) as SecondaryAccount;
      assert.isFalse(after.connected);
    }),
  );
});
