import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { org } from "../fixtures/world.ts";

const key = `avatar:${org.id}`;
const params = { orgId: OrgId.make(org.id) };
const organizationAtom = ApiClient.query("organizations", "get", {
  params,
  reactivityKeys: [key],
});
const updateAvatar = ApiClient.mutation("avatar", "updateAvatar");
const removeAvatar = ApiClient.mutation("avatar", "removeAvatar");
const presign = ApiClient.mutation("avatar", "presignAvatarUpload");

describe("avatar mock", () => {
  it.effect("presigns, updates and removes the organization avatar", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(organizationAtom);
      yield* AtomRegistry.getResult(registry, organizationAtom, {
        suspendOnWaiting: true,
      });

      registry.set(presign, {
        params,
        payload: { fileName: "logo.png", contentType: "image/png" },
        reactivityKeys: [key],
      });
      const upload = (yield* AtomRegistry.getResult(registry, presign)) as {
        uploadUrl: string;
        fileKey: string;
        expiresAt: string;
      };
      assert.include(upload.uploadUrl, "example.com");
      assert.include(upload.fileKey, "logo.png");
      assert.isString(upload.expiresAt);

      registry.set(updateAvatar, {
        params,
        payload: { url: upload.uploadUrl, mimeType: "image/png", size: 1024 },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(
        registry,
        updateAvatar,
      )) as { ok: boolean; url: string; updatedBy: string };
      assert.isTrue(updated.ok);
      assert.equal(updated.url, upload.uploadUrl);
      const afterUpdate = yield* AtomRegistry.getResult(
        registry,
        organizationAtom,
        { suspendOnWaiting: true },
      );
      assert.isString(afterUpdate.avatarUrl);
      assert.include(afterUpdate.avatarUrl ?? "", "example.com");

      registry.set(removeAvatar, { params, reactivityKeys: [key] });
      const removed = (yield* AtomRegistry.getResult(
        registry,
        removeAvatar,
      )) as { ok: boolean; avatarUrl: string | null };
      assert.isTrue(removed.ok);
      assert.isNull(removed.avatarUrl);
    }),
  );
});
