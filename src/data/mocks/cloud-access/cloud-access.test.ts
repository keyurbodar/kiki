import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { CloudAccessTargetId } from "../../api/schemas/cloud-access.ts";
import { OrgId, ProjectId } from "../../api/schemas/ids.ts";
import {
  checkCloudAccessTargetAtom,
  cloudAccessAtom,
  cloudAccessKeys,
  createCloudAccessTargetAtom,
  deleteCloudAccessTargetAtom,
  updateCloudAccessTargetAtom,
} from "../../atoms/cloud-credentials.ts";
import { orgId as worldOrgId, projects } from "../fixtures/world.ts";

const orgId = OrgId.make(worldOrgId);
const reactivityKeys = cloudAccessKeys.cloudAccess(orgId);

describe("cloud-access mock", () => {
  it.effect("serves the org's issuer with no targets", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const access = yield* AtomRegistry.getResult(
        registry,
        cloudAccessAtom(orgId),
      );
      assert.strictEqual(
        access.issuer,
        `https://api.capy.ai/oidc/orgs/${worldOrgId}`,
      );
      assert.isTrue(access.discoveryUrl.startsWith(access.issuer));
      assert.deepStrictEqual(access.targets, []);
    }),
  );

  it.effect("creates, updates, checks and removes a target", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const atom = cloudAccessAtom(orgId);
      registry.mount(atom);
      yield* AtomRegistry.getResult(registry, atom);

      registry.set(createCloudAccessTargetAtom, {
        params: { orgId },
        payload: {
          projectId: ProjectId.make(projects.web.id),
          provider: "aws",
          aws: {
            roleArn: "arn:aws:iam::123456789012:role/capy-agent",
            region: null,
            audience: "sts.amazonaws.com",
          },
        },
        reactivityKeys,
      });
      const created = yield* AtomRegistry.getResult(
        registry,
        createCloudAccessTargetAtom,
      );
      assert.strictEqual(created.provider, "aws");
      assert.strictEqual(created.lastCheck?.outcome, "ok");
      assert.strictEqual(
        created.subject,
        `org/${worldOrgId}/project/${projects.web.id}/thread/*`,
      );
      const afterCreate = yield* AtomRegistry.getResult(registry, atom, {
        suspendOnWaiting: true,
      });
      assert.lengthOf(afterCreate.targets, 1);

      const targetId = CloudAccessTargetId.make(created.id);
      registry.set(updateCloudAccessTargetAtom, {
        params: { orgId, targetId },
        payload: {
          aws: {
            roleArn: "arn:aws:iam::123456789012:role/capy-reader",
            region: "us-east-1",
            audience: "sts.amazonaws.com",
          },
        },
        reactivityKeys,
      });
      const updated = yield* AtomRegistry.getResult(
        registry,
        updateCloudAccessTargetAtom,
      );
      assert.strictEqual(updated.aws?.region, "us-east-1");

      registry.set(checkCloudAccessTargetAtom, {
        params: { orgId, targetId },
        reactivityKeys,
      });
      const checked = yield* AtomRegistry.getResult(
        registry,
        checkCloudAccessTargetAtom,
      );
      assert.strictEqual(checked.lastCheck?.outcome, "ok");

      registry.set(deleteCloudAccessTargetAtom, {
        params: { orgId, targetId },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, deleteCloudAccessTargetAtom);
      const afterDelete = yield* AtomRegistry.getResult(registry, atom, {
        suspendOnWaiting: true,
      });
      assert.lengthOf(afterDelete.targets, 0);
    }),
  );

  it.effect("leaves Vault unchecked because machines check it", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(createCloudAccessTargetAtom, {
        params: { orgId },
        payload: {
          projectId: ProjectId.make(projects.api.id),
          provider: "vault",
          vault: {
            address: "https://vault.example.com",
            role: `capy-${projects.api.id}`,
            authMount: "capy",
            namespace: null,
            audience: "https://vault.example.com",
          },
        },
        reactivityKeys,
      });
      const created = yield* AtomRegistry.getResult(
        registry,
        createCloudAccessTargetAtom,
      );
      assert.isNull(created.lastCheck);
      assert.strictEqual(created.vault?.authMount, "capy");
    }),
  );
});
