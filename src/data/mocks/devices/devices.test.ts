import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { DeviceId } from "../../api/schemas/devices.ts";
import { OrgId } from "../../api/schemas/ids.ts";
import {
  approveDeviceCodeAtom,
  deviceReactivityKeys,
  devicesAtom,
  lookupDeviceCodeAtom,
  renameDeviceAtom,
  revokeDeviceAtom,
  setDeviceAccessAtom,
} from "../../atoms/devices.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId as acmeId } from "../fixtures/world.ts";

const orgId = OrgId.make(acmeId);
const reactivityKeys = [deviceReactivityKeys.devices(orgId)];
const laptop = DeviceId.make("machine_sample_laptop");

describe("devices mock", () => {
  it.effect("lists the org's devices from the shared world", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const devices = yield* AtomRegistry.getResult(
        registry,
        devicesAtom(orgId),
      );
      assert.deepStrictEqual(
        devices.map((device) => device.name),
        ["alex-laptop", "build-box", "jordan-desktop"],
      );
      const buildBox = devices.find((device) => device.name === "build-box");
      assert.strictEqual(buildBox?.access, "shared");
      assert.strictEqual(buildBox?.ownerName, "Sam Rivera");
      assert.strictEqual(buildBox?.os, "linux");
    }),
  );

  it.effect("refetches the list after rename, access and revoke", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = devicesAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(renameDeviceAtom, {
        params: { orgId, deviceId: laptop },
        payload: { name: "studio" },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, renameDeviceAtom);
      registry.set(setDeviceAccessAtom, {
        params: { orgId, deviceId: laptop },
        payload: { access: "shared" },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, setDeviceAccessAtom);
      registry.set(revokeDeviceAtom, {
        params: { orgId, deviceId: laptop },
        reactivityKeys,
      });
      yield* AtomRegistry.getResult(registry, revokeDeviceAtom);

      const after = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      const device = after.find((row) => row.id === laptop);
      assert.strictEqual(device?.name, "studio");
      assert.strictEqual(device?.access, "shared");
      assert.isNotNull(device?.revokedAt);
      assert.isFalse(device?.connected);
    }),
  );

  it.effect("looks up and approves a pairing code into a new device", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = devicesAtom(orgId);
      registry.mount(list);
      yield* AtomRegistry.getResult(registry, list);

      registry.set(lookupDeviceCodeAtom, {
        payload: { userCode: "bcdf-ghjk" },
      });
      const preview = yield* AtomRegistry.getResult(
        registry,
        lookupDeviceCodeAtom,
      );
      assert.strictEqual(preview.hostname, "casey-laptop");

      registry.set(approveDeviceCodeAtom, {
        params: { orgId },
        payload: { userCode: "BCDF-GHJK", name: "Casey's laptop" },
        reactivityKeys,
      });
      const resolution = yield* AtomRegistry.getResult(
        registry,
        approveDeviceCodeAtom,
      );
      assert.strictEqual(resolution.status, "approved");
      const after = yield* AtomRegistry.getResult(registry, list, {
        suspendOnWaiting: true,
      });
      assert.include(
        after.map((device) => device.name),
        "Casey's laptop",
      );
    }),
  );

  it.effect("fails an unknown code with DeviceCodeNotFound", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(lookupDeviceCodeAtom, { payload: { userCode: "NOPE" } });
      const exit = yield* Effect.exit(
        AtomRegistry.getResult(registry, lookupDeviceCodeAtom),
      );
      assert.isTrue(Exit.isFailure(exit));
      assert.include(JSON.stringify(exit), "capy/DeviceCodeNotFound");
    }),
  );

  it.effect("answers every remaining device endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const call = <A>(endpoint: string, input: object) =>
        AtomRegistry.getResult(
          registry,
          ApiClient.query("devices", endpoint as never, input as never),
        ) as unknown as Effect.Effect<A>;
      const params = { orgId, deviceId: "machine_sample_buildbox" };
      const codeStart = yield* call<{
        userCode: string;
        verificationUrl: string;
      }>("codeStart", { payload: { hostname: "ci-runner" } });
      assert.include(codeStart.verificationUrl, "devices");
      assert.isDefined(
        yield* call("codePoll", { payload: { userCode: "ABCD-1234" } }),
      );
      assert.isDefined(
        yield* call("enroll", { payload: { hostname: "spare-box" } }),
      );

      const access = yield* call<ReadonlyArray<{ id: string }>>("listAccess", {
        params,
      });
      assert.isAbove(access.length, 0);
      for (const row of access) {
        assert.isDefined(
          yield* call("grantAccess", {
            params: { ...params, accessId: row.id },
          }),
        );
      }

      const agentRows = yield* call<ReadonlyArray<{ id: string }>>(
        "listAgentAccess",
        { params },
      );
      assert.isAbove(agentRows.length, 0);
      for (const row of agentRows) {
        assert.isDefined(
          yield* call("grantAgentAccess", {
            params: { ...params, accessId: row.id },
            payload: {},
          }),
        );
        assert.isDefined(
          yield* call("revokeAgentAccess", {
            params: { ...params, accessId: row.id },
          }),
        );
      }
      assert.isDefined(
        yield* call("listThreadAgentAccess", {
          params: { orgId, threadId: "jam_sample_0001" },
        }),
      );
      assert.isAbove(
        (yield* call<ReadonlyArray<unknown>>("activeThreads", {
          params: { orgId, deviceId: "machine_sample_laptop" },
        })).length,
        0,
      );

      const checkouts = yield* call<ReadonlyArray<{ id: string }>>(
        "findCheckouts",
        { params: { orgId, deviceId: "machine_sample_laptop" }, payload: {} },
      );
      assert.isAbove(checkouts.length, 0);
      assert.isDefined(
        yield* call("setProjectCheckout", { params, payload: {} }),
      );
      assert.isDefined(
        yield* call("clearProjectCheckout", { params, payload: {} }),
      );
      assert.isDefined(
        yield* call("listProjectCheckouts", {
          params: { orgId, projectId: "proj_sample_web" },
        }),
      );

      const folders = yield* call<ReadonlyArray<{ id: string }>>(
        "browseFolders",
        { params, query: {} },
      );
      assert.isAbove(folders.length, 0);
      const folder = folders[0]?.id ?? "";
      assert.isDefined(
        yield* call("linkFolder", { params, payload: { folderId: folder } }),
      );
      assert.isDefined(
        yield* call("unlinkFolder", { params, payload: { folderId: folder } }),
      );

      const computerRows = yield* call<ReadonlyArray<{ id: string }>>(
        "listAccess",
        { params: { orgId, deviceId: "machine_sample_desktop" } },
      );
      const pending = computerRows[0]?.id ?? "";
      assert.isDefined(
        yield* call("denyAccess", { params: { ...params, accessId: pending } }),
      );
      assert.isDefined(
        yield* call("revokeAccess", {
          params: { ...params, accessId: pending },
        }),
      );
      assert.isDefined(
        yield* call("withdrawAccess", {
          params: { ...params, accessId: pending },
        }),
      );

      assert.isDefined(
        yield* call("workspaceIndex", {
          params: { orgId, deviceId: laptop },
          query: {},
        }),
      );
      assert.isAbove(
        (yield* call<ReadonlyArray<unknown>>("worktrees", {
          params: { orgId, deviceId: "machine_sample_buildbox" },
          query: {},
        })).length,
        0,
      );

      const pulls = yield* call<ReadonlyArray<{ number: number }>>("pullList", {
        params,
        query: {},
      });
      assert.isAbove(pulls.length, 0);
      assert.isDefined(
        yield* call("pullDetail", {
          params: { ...params, number: "214" },
          query: {},
        }),
      );
      assert.isDefined(
        yield* call("pullDiff", {
          params: { ...params, number: "214" },
          query: {},
        }),
      );
      assert.isDefined(yield* call("pullRefresh", { params, query: {} }));
      assert.isDefined(
        yield* call("pullAct", {
          params: { ...params, number: "214" },
          query: {},
          payload: { action: "ready" },
        }),
      );
    }),
  );
});
