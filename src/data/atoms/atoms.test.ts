import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId, ProjectId } from "../api/schemas/ids.ts";
import { projectsAtom } from "./projects.ts";
import { currentUserAtom, organizationsAtom } from "./session.ts";
import { threadListKey, threadsAtom } from "./threads.ts";

const orgId = OrgId.make("org_sample_acme");

describe("data atoms over MockServices", () => {
  it.effect("resolve the session user and organizations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const user = yield* AtomRegistry.getResult(registry, currentUserAtom);
      const organizations = yield* AtomRegistry.getResult(
        registry,
        organizationsAtom,
      );
      assert.strictEqual(user.email, "alex@example.com");
      assert.strictEqual(organizations[0]?.id, orgId);
    }),
  );

  it.effect("share one atom per family key", () =>
    Effect.gen(function* () {
      assert.strictEqual(projectsAtom(orgId), projectsAtom(orgId));
      assert.strictEqual(threadsAtom(orgId), threadsAtom(orgId));
      const registry = AtomRegistry.make();
      const projects = yield* AtomRegistry.getResult(
        registry,
        projectsAtom(orgId),
      );
      assert.deepStrictEqual(
        projects.map((project) => project.name),
        ["Web app", "API", "Docs"],
      );
    }),
  );

  it.effect("scope the thread list by project", () =>
    Effect.gen(function* () {
      const docs = ProjectId.make("proj_sample_docs");
      assert.strictEqual(threadListKey(orgId, docs), `${orgId}/${docs}`);
      const registry = AtomRegistry.make();
      const all = yield* AtomRegistry.getResult(registry, threadsAtom(orgId));
      const scoped = yield* AtomRegistry.getResult(
        registry,
        threadsAtom(orgId, docs),
      );
      assert.strictEqual(all.items.length, 10);
      assert.deepStrictEqual(
        scoped.items.map((thread) => thread.title),
        ["Write the getting started guide"],
      );
    }),
  );
});
