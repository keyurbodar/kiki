import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { ServiceUserDetail } from "../../api/schemas/api-keys.ts";
import { OrgId, ServiceUserId } from "../../api/schemas/ids.ts";
import {
  apiSettingsKeys,
  createServiceUser,
  disableServiceUser,
  replaceServiceUserProjects,
  serviceUserAtom,
  serviceUserKey,
  serviceUsersAtom,
} from "../../atoms/api-keys.ts";
import { orgId as worldOrgId } from "../fixtures/world.ts";

const orgId = OrgId.make(worldOrgId);
const reactivityKeys = apiSettingsKeys.apiSettings(orgId);

describe("serviceUsers mock", () => {
  it.effect("lists the world's service users and gets one in detail", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = yield* AtomRegistry.getResult(
        registry,
        serviceUsersAtom(orgId),
      );
      assert.deepStrictEqual(
        list.map((user) => user.name),
        ["Release bot", "Triage bot"],
      );
      const detail = yield* AtomRegistry.getResult(
        registry,
        serviceUserAtom(serviceUserKey(orgId, "svc_sample_release")),
      );
      assert.strictEqual(detail.projectIds.length, 2);
    }),
  );

  it.effect("creates, disables and narrows project access", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = serviceUsersAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(createServiceUser, {
        params: { orgId },
        payload: { name: "Docs sync", role: "read_only" },
        reactivityKeys,
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        createServiceUser,
      )) as ServiceUserDetail;
      const afterCreate = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      assert.include(
        afterCreate.map((user) => user.name),
        "Docs sync",
      );

      const params = { orgId, serviceUserId: ServiceUserId.make(created.id) };
      registry.set(disableServiceUser, { params, reactivityKeys });
      yield* AtomRegistry.getResult(registry, disableServiceUser);
      registry.set(replaceServiceUserProjects, {
        params,
        payload: { projectAccessMode: "allowlist", projectIds: [] },
        reactivityKeys,
      });
      const narrowed = (yield* AtomRegistry.getResult(
        registry,
        replaceServiceUserProjects,
      )) as ServiceUserDetail;
      assert.isNotNull(narrowed.disabledAt);
      assert.strictEqual(narrowed.projectAccessMode, "allowlist");
    }),
  );
});
